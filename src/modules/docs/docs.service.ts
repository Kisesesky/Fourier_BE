// src/module/docs/docs.service.ts
import { ForbiddenException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { Folder } from './entities/folder.entity';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { User } from '../users/entities/user.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
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
import { Project } from '../projects/entities/project.entity';
import { DocumentComment } from './entities/document-comment.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';

@Injectable()
export class DocsService {
  private ydocs = new Map<string, Y.Doc>(); // 메모리 상 CRDT 문서 저장
  private starredColumnAvailable: boolean | null = null;

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
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(DocumentComment)
    private readonly documentCommentRepository: Repository<DocumentComment>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  async createFolder(dto: CreateFolderDto, user: User) {
    const project = await this.projectRepository.findOneBy({ id: dto.projectId });
    if (!project) throw new BadRequestException('invalid projectId');

    const parent = dto.parentId
      ? await this.folderRepository.findOne({ where: { id: dto.parentId, project: { id: dto.projectId } } })
      : null;

    const folder = await this.folderRepository.save({
      project,
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

  async getFolders(userId: string, projectId: string) {
    let rows: Array<{ id: string; name: string; parentId?: string | null; createdAt: Date; updatedAt: Date }> = [];
    try {
      rows = await this.folderRepository
        .createQueryBuilder('folder')
        .innerJoin('folder.members', 'member', 'member.userId = :userId', { userId })
        .where('folder.projectId = :projectId', { projectId })
        .select('folder.id', 'id')
        .addSelect('folder.name', 'name')
        .addSelect('folder.parentId', 'parentId')
        .addSelect('folder.createdAt', 'createdAt')
        .addSelect('folder.updatedAt', 'updatedAt')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();
    } catch {
      // Migration not applied yet: fallback query without project scope.
      rows = await this.folderRepository
        .createQueryBuilder('folder')
        .innerJoin('folder.members', 'member', 'member.userId = :userId', { userId })
        .select('folder.id', 'id')
        .addSelect('folder.name', 'name')
        .addSelect('folder.parentId', 'parentId')
        .addSelect('folder.createdAt', 'createdAt')
        .addSelect('folder.updatedAt', 'updatedAt')
        .orderBy('folder.createdAt', 'ASC')
        .getRawMany();
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      parentId: row.parentId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async updateFolder(id: string, dto: UpdateFolderDto) {
    const folder = await this.folderRepository.findOneBy({ id });
    if (!folder) return null;
    if (dto.name !== undefined) folder.name = dto.name;
    if (dto.parentId !== undefined) {
      folder.parent = dto.parentId
        ? await this.folderRepository.findOneBy({ id: dto.parentId })
        : null;
    }
    return this.folderRepository.save(folder);
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
    const project = await this.projectRepository.findOneBy({ id: dto.projectId });
    if (!project) throw new BadRequestException('invalid projectId');

    const folder = dto.folderId
      ? await this.folderRepository.findOne({ where: { id: dto.folderId, project: { id: dto.projectId } } })
      : null;

    const content = dto.content ?? '';
    const searchText = `${dto.title} ${content}`.trim();

    const hasStarred = await this.hasStarredColumn();
    const insertValues: Record<string, unknown> = {
      title: dto.title,
      content,
      project,
      folder,
      author: user,
      searchVector: () => "to_tsvector('simple', :sv)",
    };
    if (hasStarred) {
      insertValues.starred = Boolean(dto.starred);
    }

    const insertResult = await this.documentRepository
      .createQueryBuilder()
      .insert()
      .into(Document)
      .values(insertValues)
      .setParameter('sv', searchText)
      .returning(['id', 'title', 'content', 'createdAt', 'updatedAt'])
      .execute();

    const docId = insertResult.identifiers[0]?.id;
    const doc = await this.getDocumentByIdSafe(docId);
    if (!doc) throw new NotFoundException('document not found');

    await this.documentMemberRepository.save({
      document: doc,
      user,
      permission: DocPermission.ADMIN,
    });

    await this.saveVersion(doc, user);

    return doc;
  }

  async getDocuments(userId: string, projectId: string) {
    const hasStarred = await this.hasStarredColumn();
    let rows: Array<{
      id: string;
      title: string;
      content?: string | null;
      starred?: boolean;
      folderId?: string | null;
      authorId?: string | null;
      authorName?: string | null;
      authorDisplayName?: string | null;
      authorAvatarUrl?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    const query = (withProjectScope: boolean) => {
      const qb = this.documentRepository
        .createQueryBuilder('doc')
        .leftJoin('doc.folder', 'folder')
        .leftJoin('doc.author', 'author')
        .leftJoin(DocumentMember, 'dm', 'dm.documentId = doc.id')
        .leftJoin(FolderMember, 'fm', 'fm.folderId = folder.id')
        .where('(dm.userId = :userId OR fm.userId = :userId)', { userId });

      if (withProjectScope) {
        qb.andWhere('doc.projectId = :projectId', { projectId });
      }

      qb.select('doc.id', 'id')
        .addSelect('doc.title', 'title')
        .addSelect('doc.content', 'content')
        .addSelect('doc.createdAt', 'createdAt')
        .addSelect('doc.updatedAt', 'updatedAt')
        .addSelect('folder.id', 'folderId')
        .addSelect('author.id', 'authorId')
        .addSelect('author.name', 'authorName')
        .addSelect('author.displayName', 'authorDisplayName')
        .addSelect('author.avatarUrl', 'authorAvatarUrl')
        .distinct(true)
        .orderBy('doc.updatedAt', 'DESC');

      if (hasStarred) {
        qb.addSelect('doc.starred', 'starred');
      }
      return qb.getRawMany();
    };

    try {
      rows = await query(true);
    } catch {
      rows = await query(false);
    }

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content ?? '',
      starred: hasStarred ? Boolean(row.starred) : false,
      folderId: row.folderId ?? null,
      authorId: row.authorId ?? null,
      authorName: row.authorDisplayName || row.authorName || 'User',
      authorAvatarUrl: row.authorAvatarUrl ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async updateDocument(id: string, dto: UpdateDocumentDto, user: User) {
    const doc = await this.getDocumentByIdSafe(id);
    if (!doc) {
      throw new NotFoundException('document not found');
    }

    const hasStarred = await this.hasStarredColumn();
    const nextDto: UpdateDocumentDto = { ...dto };
    if (!hasStarred && 'starred' in nextDto) {
      delete (nextDto as { starred?: boolean }).starred;
    }

    if (nextDto.title !== undefined) {
      doc.title = nextDto.title;
    }
    if (nextDto.content !== undefined) {
      doc.content = nextDto.content;
    }
    if (hasStarred && nextDto.starred !== undefined) {
      doc.starred = Boolean(nextDto.starred);
    }
    if ('folderId' in nextDto) {
      if (!nextDto.folderId) {
        doc.folder = null;
      } else {
        const folder = await this.folderRepository.findOne({
          where: {
            id: nextDto.folderId,
            ...(doc.project?.id ? { project: { id: doc.project.id } } : {}),
          },
        });
        if (!folder) {
          throw new BadRequestException('invalid folderId');
        }
        doc.folder = folder;
      }
    }
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
    const doc = await this.getDocumentByIdSafe(documentId);
    if (!doc) {
      throw new NotFoundException('document not found');
    }

    return this.documentMemberRepository.save({
      document: doc,
      user: { id: dto.userId } as User,
      permission: dto.permission,
    });
  }

  async getDocAnalytics(
    user: User,
    opts: {
      granularity: 'hourly' | 'daily' | 'monthly';
      date?: string;
      month?: string;
      year?: string;
      projectId?: string;
    },
  ) {
    const { granularity, date, month, year, projectId } = opts;
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

    const qb = this.documentRepository
      .createQueryBuilder('document')
      .leftJoin('document.members', 'member')
      .where('member.userId = :userId', { userId: user.id })
      .andWhere('document.createdAt >= :start', { start })
      .andWhere('document.createdAt < :end', { end });

    if (projectId) {
      qb.andWhere('document.projectId = :projectId', { projectId });
    }

    const rows = await qb.select(['document.createdAt']).getMany();

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

    const doc = await this.getDocumentByIdSafe(id);
    if (!doc) {
      throw new NotFoundException('document not found');
    }
    const ydoc = new Y.Doc();
    ydoc.getText('content').insert(0, doc.content ?? '');
    this.ydocs.set(id, ydoc);

    setTimeout(() => this.ydocs.delete(id), 1000 * 60 * 30);
    return ydoc;
  }

  async applyOps(documentId: string, user: User, ops: EditOptionDto[]) {
    const hasStarred = await this.hasStarredColumn();
    const qb = this.documentRepository
      .createQueryBuilder('doc')
      .leftJoin('doc.folder', 'folder')
      .where('doc.id = :id', { id: documentId })
      .select('doc.id', 'id')
      .addSelect('doc.title', 'title')
      .addSelect('doc.content', 'content')
      .addSelect('doc.createdAt', 'createdAt')
      .addSelect('doc.updatedAt', 'updatedAt')
      .addSelect('folder.id', 'folderId');

    if (hasStarred) {
      qb.addSelect('doc.starred', 'starred');
    }

    const row = await qb.getRawOne<{
      id: string;
      title: string;
      content: string | null;
      starred?: boolean;
      folderId?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>();
    if (!row) {
      throw new NotFoundException('document not found');
    }
    const doc = this.mapRawDocument(row, hasStarred);
    doc.folder = row.folderId ? ({ id: row.folderId } as Folder) : undefined;

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

  async getDocumentComments(documentId: string, user: User) {
    const document = await this.ensureDocumentReadable(documentId, user.id);

    const comments = await this.documentCommentRepository.find({
      where: { document: { id: documentId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });

    const roleMap = await this.getProjectRoleMap(
      document.project?.id ?? null,
      comments.map((comment) => comment.author?.id).filter(Boolean) as string[],
    );

    return comments.map((comment) =>
      this.mapComment(comment, user.id, roleMap[comment.author?.id ?? ''] ?? null),
    );
  }

  async addDocumentComment(documentId: string, user: User, content: string) {
    const doc = await this.ensureDocumentReadable(documentId, user.id);
    const normalized = content?.trim();
    if (!normalized) {
      throw new BadRequestException('content is required');
    }

    const created = await this.documentCommentRepository.save({
      document: doc,
      author: user,
      content: normalized,
    });

    const saved = await this.documentCommentRepository.findOne({
      where: { id: created.id },
      relations: ['author', 'document', 'document.project'],
    });
    const authorRole = await this.getProjectRole(saved?.document?.project?.id, saved?.author?.id);
    return this.mapComment(saved, user.id, authorRole);
  }

  async updateDocumentComment(commentId: string, user: User, content: string) {
    const normalized = content?.trim();
    if (!normalized) {
      throw new BadRequestException('content is required');
    }

    const comment = await this.documentCommentRepository.findOne({
      where: { id: commentId },
      relations: ['document', 'author'],
    });
    if (!comment) {
      throw new NotFoundException('comment not found');
    }

    await this.ensureDocumentReadable(comment.document.id, user.id);
    if (comment.author?.id !== user.id) {
      throw new ForbiddenException('본인이 작성한 댓글만 수정할 수 있습니다.');
    }

    comment.content = normalized;
    const updated = await this.documentCommentRepository.save(comment);
    const authorRole = await this.getProjectRole(updated?.document?.project?.id, updated?.author?.id);
    return this.mapComment(updated, user.id, authorRole);
  }

  async removeDocumentComment(commentId: string, user: User) {
    const comment = await this.documentCommentRepository.findOne({
      where: { id: commentId },
      relations: ['document', 'author'],
    });
    if (!comment) {
      throw new NotFoundException('comment not found');
    }

    await this.ensureDocumentReadable(comment.document.id, user.id);
    if (comment.author?.id !== user.id) {
      throw new ForbiddenException('본인이 작성한 댓글만 삭제할 수 있습니다.');
    }

    await this.documentCommentRepository.delete(commentId);
    return { ok: true };
  }

  private async ensureDocumentReadable(documentId: string, userId: string) {
    const document = await this.getDocumentByIdSafe(documentId);
    if (!document) {
      throw new NotFoundException('document not found');
    }

    const accessible = await this.documentRepository
      .createQueryBuilder('doc')
      .leftJoin('doc.folder', 'folder')
      .leftJoin(DocumentMember, 'dm', 'dm.documentId = doc.id AND dm.userId = :userId', { userId })
      .leftJoin(FolderMember, 'fm', 'fm.folderId = folder.id AND fm.userId = :userId', { userId })
      .where('doc.id = :documentId', { documentId })
      .andWhere('(dm.id IS NOT NULL OR fm.id IS NOT NULL)')
      .select(['doc.id'])
      .getOne();

    if (!accessible) {
      throw new ForbiddenException('document access denied');
    }

    return document;
  }

  private mapComment(comment: DocumentComment, userId: string, authorRole: string | null) {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: comment.author?.id ?? null,
      authorName: comment.author?.displayName || comment.author?.name || '익명',
      authorAvatarUrl: comment.author?.avatarUrl ?? null,
      authorRole,
      mine: comment.author?.id === userId,
    };
  }

  private async getProjectRole(projectId?: string | null, userId?: string | null) {
    if (!projectId || !userId) return null;
    const member = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    return member?.role ?? null;
  }

  private async getProjectRoleMap(projectId: string | null, userIds: string[]) {
    const map: Record<string, string> = {};
    if (!projectId || userIds.length === 0) return map;
    const members = await this.projectMemberRepository.find({
      where: {
        project: { id: projectId },
        user: { id: In(userIds) },
      },
      relations: ['user'],
    });
    members.forEach((member) => {
      if (member.user?.id) {
        map[member.user.id] = member.role;
      }
    });
    return map;
  }

  private async hasStarredColumn() {
    if (this.starredColumnAvailable !== null) {
      return this.starredColumnAvailable;
    }

    try {
      const rows = await this.documentRepository.query(
        `
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'document'
            AND column_name = 'starred'
          LIMIT 1
        `,
      );
      this.starredColumnAvailable = Array.isArray(rows) && rows.length > 0;
    } catch {
      this.starredColumnAvailable = false;
    }

    return this.starredColumnAvailable;
  }

  private async getDocumentByIdSafe(id: string) {
    const hasStarred = await this.hasStarredColumn();
    const qb = this.documentRepository
      .createQueryBuilder('doc')
      .leftJoin('doc.project', 'project')
      .where('doc.id = :id', { id })
      .select('doc.id', 'id')
      .addSelect('doc.title', 'title')
      .addSelect('doc.content', 'content')
      .addSelect('doc.createdAt', 'createdAt')
      .addSelect('doc.updatedAt', 'updatedAt')
      .addSelect('project.id', 'projectId');

    if (hasStarred) {
      qb.addSelect('doc.starred', 'starred');
    }

    try {
      const row = await qb.getRawOne<{
        id: string;
        title: string;
        content: string | null;
        starred?: boolean;
        projectId?: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>();
      if (!row) return null;
      return this.mapRawDocument(row, hasStarred);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        this.starredColumnAvailable = false;
      }
      const fallbackRow = await this.documentRepository
        .createQueryBuilder('doc')
        .leftJoin('doc.project', 'project')
        .where('doc.id = :id', { id })
        .select('doc.id', 'id')
        .addSelect('doc.title', 'title')
        .addSelect('doc.content', 'content')
        .addSelect('doc.createdAt', 'createdAt')
        .addSelect('doc.updatedAt', 'updatedAt')
        .addSelect('project.id', 'projectId')
        .getRawOne<{
          id: string;
          title: string;
          content: string | null;
          projectId?: string | null;
          createdAt: Date;
          updatedAt: Date;
        }>();
      if (!fallbackRow) return null;
      return this.mapRawDocument(fallbackRow, false);
    }
  }

  private mapRawDocument(
    row: {
      id: string;
      title: string;
      content: string | null;
      starred?: boolean;
      projectId?: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    hasStarred: boolean,
  ) {
    const doc = new Document();
    doc.id = row.id;
    doc.title = row.title;
    doc.content = row.content ?? '';
    doc.starred = hasStarred ? Boolean(row.starred) : false;
    doc.project = row.projectId ? ({ id: row.projectId } as Project) : undefined;
    doc.createdAt = row.createdAt;
    doc.updatedAt = row.updatedAt;
    return doc;
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
