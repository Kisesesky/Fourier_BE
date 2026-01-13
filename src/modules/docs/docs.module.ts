// src/modules/docs/docs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocsService } from './docs.service';
import { DocsController } from './docs.controller';
import { DocsGateway } from './docs.gateway';
import { Folder } from './entities/folder.entity';
import { Document } from './entities/document.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { DocumentCursor } from './entities/document-cursor.entity';
import { FolderMember } from './entities/folder-member.entity';
import { DocumentMember } from './entities/document-member.entity';
import { NotificationModule } from '../notification/notification.module';
import { DocPermissionService } from './services/doc-permission.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentVersion, DocumentCursor, DocumentMember, Folder,  FolderMember, User]),
    NotificationModule,
  ],
  providers: [DocsService, DocsGateway, DocPermissionService],
  controllers: [DocsController],
  exports: [DocsService],
})
export class DocsModule {}