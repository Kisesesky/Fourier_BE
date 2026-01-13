// src/modules/docs/services/doc-permission.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DocPermission } from "../constants/doc-permission.enum";
import { DocumentMember } from "../entities/document-member.entity";
import { FolderMember } from "../entities/folder-member.entity";
import { Folder } from "../entities/folder.entity";
import { Document } from '../entities/document.entity';

@Injectable()
export class DocPermissionService {
  constructor(
    @InjectRepository(DocumentMember)
    private readonly docMemberRepo: Repository<DocumentMember>,
    @InjectRepository(FolderMember)
    private readonly folderMemberRepo: Repository<FolderMember>,
    @InjectRepository(Folder)
    private readonly folderRepo: Repository<Folder>,
  ) {}

  async getUserPermission(
    userId: string,
    document?: Document,
    folder?: Folder,
  ): Promise<DocPermission | null> {

    // 1️⃣ 문서 권한 우선
    if (document) {
      const docMember = await this.docMemberRepo.findOne({
        where: { document: { id: document.id }, user: { id: userId } },
      });
      if (docMember) return docMember.permission;
    }

    // 2️⃣ 폴더 권한 (상속)
    let current = folder || document?.folder;
    while (current) {
      const folderMember = await this.folderMemberRepo.findOne({
        where: { folder: { id: current.id }, user: { id: userId } },
      });
      if (folderMember) return folderMember.permission;

      current = await this.folderRepo.findOne({
        where: { id: current.parent?.id },
        relations: ['parent'],
      });
    }

    return null;
  }
}