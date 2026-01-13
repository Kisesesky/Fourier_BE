// src/modules/files/files.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { GcsService } from '../gcs/gcs.service';
import { FileStatus } from './constants/file-status.enum';
import { FileType } from './constants/file-type.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    private readonly gcsService: GcsService,
  ) {}

  async upload(
    file: Express.Multer.File,
    user?: User,
  ): Promise<File> {
    // 1. 먼저 DB에 PENDING 생성
    const entity = this.fileRepo.create({
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy: user,
      type: this.detectType(file.mimetype),
      status: FileStatus.PENDING,
    });

    await this.fileRepo.save(entity);

    try {
      // 2. GCS 업로드
      const fileUrl = await this.gcsService.uploadFile(
        file,
        `files/${entity.id}/${file.originalname}`,
      );

      // 3. 썸네일 (이미지만)
      const thumbnailUrl =
        entity.type === FileType.IMAGE
          ? await this.gcsService.generateThumbnail(file, entity.id)
          : undefined;

      // 4. DONE
      Object.assign(entity, {
        fileUrl,
        thumbnailUrl,
        status: FileStatus.DONE,
      });

      return await this.fileRepo.save(entity);
    } catch (error) {
      entity.status = FileStatus.FAILED;
      entity.errorMessage = error.message;
      await this.fileRepo.save(entity);
      throw error;
    }
  }

  async createTextFile(
    content: string,
    user: User,
  ): Promise<File> {
    const upload = await this.gcsService.uploadTextAsFile(
      content,
      `messages/${Date.now()}.txt`,
    );

    return this.fileRepo.save({
      fileUrl: upload.fileUrl,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      fileSize: upload.fileSize,
      type: FileType.DOCUMENT,
      status: FileStatus.DONE,
      uploadedBy: user,
    });
  }

  private detectType(mime: string): FileType {
    if (mime.startsWith('image/')) return FileType.IMAGE;
    if (mime.startsWith('text/')) return FileType.DOCUMENT;
    return FileType.FILE;
  }
}