// src/module/docs/docs.service.ts
import { ForbiddenException, Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { User } from '../users/entities/user.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentCursor } from './entities/document-cursor.entity';
import * as Y from 'yjs';
import { FolderMember } from './entities/folder-member.entity';
import { DocumentMember } from './entities/document-member.entity';
import { DocPermission } from './constants/doc-permission.enum';
import { NotificationService } from '../notification/notification.service';
import { DocPermissionService } from './services/doc-permission.service';
import { extractMentions } from './utils/mention.util';
import { EditOptionDto } from './dto/edit-document.dto';
import { UpdateDocPermissionDto } from './dto/update-document-permission.dto';
import { NotificationType } from '../notification/constants/notification-type.enum';

@Injectable()
export class DocsService {
  private ydocs = new Map<string, Y.Doc>(); // 메모리 상 CRDT 문서 저장

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentVersion)
    private readonly documentVersionRepository: Repository<DocumentVersion>,
    @InjectRepository(DocumentCursor)
    private readonly documentCursorRepository: Repository<DocumentCursor>,
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @InjectRepository(DocumentMember)
    private readonly documentMemberRepository: Repository<DocumentMember>,
    @InjectRepository(FolderMember)
    private readonly folderMemberRepository: Repository<FolderMember>,
    private readonly notificationService: NotificationService,
    private readonly documentPermissionService: DocPermissionService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createFolder(dto: CreateFolderDto, user: User) {
    const parent = dto.parentId
      ? await this.folderRepository.findOneBy({ id: dto.parentId })
      : null;

    const folder = await this.folderRepository.save({
      name: dto.name,
      parent,
      owner: user,
    });

    await this.folderMemberRepository.save({
      folder,
      user,
      permission: DocPermission.ADMIN,
    });

    return folder;
  }

  async moveFolder(id: string, parentId?: string) {
    const folder = await this.folderRepository.findOneBy({ id });
    folder.parent = parentId
      ? await this.folderRepository.findOneBy({ id: parentId })
      : null;
    return this.folderRepository.save(folder);
  }

  async removeFolder(id: string) {
    return this.folderRepository.delete(id);
  }

  /* -------------------- Document -------------------- */

  async createDocument(dto: CreateDocumentDto, user: User) {
    const folder = dto.folderId
      ? await this.folderRepository.findOneBy({ id: dto.folderId })
      : null;

    const content = dto.content ?? '';
    const searchText = `${dto.title} ${content}`.trim();

    const insertResult = await this.documentRepository
      .createQueryBuilder()
      .insert()
      .into(Document)
      .values({
        title: dto.title,
        content,
        folder,
        author: user,
        searchVector: () => "to_tsvector('simple', :sv)",
      })
      .setParameter('sv', searchText)
      .returning(['id', 'title', 'content', 'createdAt', 'updatedAt'])
      .execute();

    const docId = insertResult.identifiers[0]?.id;
    const doc = await this.documentRepository.findOneBy({ id: docId });

    await this.documentMemberRepository.save({
      document: doc,
      user,
      permission: DocPermission.ADMIN,
    });

    await this.saveVersion(doc, user);

    return doc;
  }

  async updateDocument(id: string, dto: UpdateDocumentDto, user: User) {
    const doc = await this.documentRepository.findOneBy({ id });
    Object.assign(doc, dto);
    await this.documentRepository.save(doc);
    const searchText = `${doc.title} ${doc.content ?? ''}`.trim();
    await this.documentRepository
      .createQueryBuilder()
      .update(Document)
      .set({ searchVector: () => "to_tsvector('simple', :sv)" })
      .setParameter('sv', searchText)
      .where('id = :id', { id })
      .execute();
    await this.saveVersion(doc, user);
    return doc;
  }

  async removeDocument(id: string) {
    this.ydocs.delete(id);
    return this.documentRepository.delete(id);
  }

  async updateDocumentPermission(
    documentId: string,
    dto: UpdateDocPermissionDto,
  ) {
    const doc = await this.documentRepository.findOneBy({ id: documentId });

    return this.documentMemberRepository.save({
      document: doc,
      user: { id: dto.userId } as User,
      permission: dto.permission,
    });
  }

  async getDocAnalytics(
    user: User,
    opts: { granularity: 'hourly' | 'daily' | 'monthly'; date?: string; month?: string; year?: string },
  ) {
    const { granularity, date, month, year } = opts;
    let start: Date;
    let end: Date;
    let counts: number[] = [];

    if (granularity === 'hourly') {
      if (!date) throw new BadRequestException('date is required for hourly');
      const parsed = new Date(`${date}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) throw new BadRequestException('invalid date format');
      start = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      end = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + 1);
      counts = Array.from({ length: 24 }, () => 0);
    } else if (granularity === 'daily') {
      if (!month) throw new BadRequestException('month is required for daily');
      const [y, m] = month.split('-').map((v) => Number(v));
      if (!y || !m) throw new BadRequestException('invalid month format');
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 1);
      const daysInMonth = new Date(y, m, 0).getDate();
      counts = Array.from({ length: daysInMonth }, () => 0);
    } else {
      if (!year) throw new BadRequestException('year is required for monthly');
      const y = Number(year);
      if (!y) throw new BadRequestException('invalid year format');
      start = new Date(y, 0, 1);
      end = new Date(y + 1, 0, 1);
      counts = Array.from({ length: 12 }, () => 0);
    }

    const rows = await this.documentRepository
      .createQueryBuilder('document')
      .leftJoin('document.members', 'member')
      .where('member.userId = :userId', { userId: user.id })
      .andWhere('document.createdAt >= :start', { start })
      .andWhere('document.createdAt < :end', { end })
      .select(['document.createdAt'])
      .getMany();

    rows.forEach((row) => {
      const dt = new Date(row.createdAt);
      if (granularity === 'hourly') counts[dt.getHours()] += 1;
      else if (granularity === 'daily') counts[dt.getDate() - 1] += 1;
      else counts[dt.getMonth()] += 1;
    });

    return { granularity, counts };
  }

  /* -------------------- Version -------------------- */

  async saveVersion(doc: Document, user: User) {
    return this.documentVersionRepository.save({
      document: doc,
      editor: user,
      content: doc.content,
    });
  }

  async getVersions(id: string) {
    return this.documentVersionRepository.find({
      where: { document: { id } },
      order: { createdAt: 'DESC' },
    });
  }

  /* -------------------- Real-time -------------------- */

  async getYDoc(id: string): Promise<Y.Doc> {
    if (this.ydocs.has(id)) return this.ydocs.get(id);

    const doc = await this.documentRepository.findOneBy({ id });
    const ydoc = new Y.Doc();
    ydoc.getText('content').insert(0, doc.content ?? '');
    this.ydocs.set(id, ydoc);

    setTimeout(() => this.ydocs.delete(id), 1000 * 60 * 30);
    return ydoc;
  }

  async applyOps(documentId: string, user: User, ops: EditOptionDto[]) {
    const doc = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['folder'],
    });

    const permission = await this.documentPermissionService.getUserPermission(
      user.id,
      doc,
    );

    if (!permission || permission === DocPermission.READ) {
      throw new ForbiddenException();
    }

    const ydoc = await this.getYDoc(documentId);
    const ytext = ydoc.getText('content');

    for (const op of ops) {
      if (op.type === 'insert') {
        ytext.insert(op.position, op.text ?? '');
      }
      if (op.type === 'delete') {
        ytext.delete(op.position, op.length ?? 0);
      }
    }

    doc.content = ytext.toString();
    await this.documentRepository.save(doc);
    await this.saveVersion(doc, user);
    await this.handleMentions(doc, user);

    return doc;
  }

  async updateCursor(documentId: string, user: User, position: number) {
    return this.documentCursorRepository.upsert(
      {
        document: { id: documentId },
        user,
        position,
      },
      ['document', 'user'],
    );
  }

  async searchDocs(userId: string, keyword: string) {
    return this.documentRepository
      .createQueryBuilder('doc')
      .leftJoin('doc.folder', 'folder')
      .leftJoin(DocumentMember, 'dm', 'dm.documentId = doc.id')
      .leftJoin(FolderMember, 'fm', 'fm.folderId = folder.id')
      .where('(dm.userId = :userId OR fm.userId = :userId)', { userId })
      .andWhere(`doc.searchVector @@ plainto_tsquery(:q)`, { q: keyword })
      .select(['doc.id', 'doc.title', 'doc.updatedAt'])
      .getMany();
  }

  private async handleMentions(doc: Document, editor: User) {
    const usernames = extractMentions(doc.content || '');
    if (!usernames.length) return;

    const users = await this.usersRepository.find({ where: { name: In(usernames) } });

    for (const user of users) {
      if (user.id === editor.id) continue;

      const perm = await this.documentPermissionService.getUserPermission(user.id, doc);
      if (!perm) continue;

      await this.notificationService.create({
        user,
        type: NotificationType.DOCMENTION,
        payload: {
          documentId: doc.id,
          title: doc.title,
          fromUserId: editor.id,
        },
      });
    }
  }
}
