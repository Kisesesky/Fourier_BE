// src/modules/gcs/gcs.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { GcsConfigService } from 'src/config/gcs/config.service';
import { v4 as uuidv4 } from 'uuid';
import { AppConfigService } from 'src/config/app/config.service';

@Injectable()
export class GcsService {
  private readonly logger = new Logger(GcsService.name);
  private storage: Storage;
  private bucketName: string;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly gcsConfig: GcsConfigService,
    keyFilename: string,
    ) {
    this.storage = new Storage({
      projectId: this.gcsConfig.gcsProjectId!,
      keyFilename,
    });
    this.bucketName = this.gcsConfig.gcsBucketName!;
  }

  async uploadImageFile(file: Express.Multer.File, destination?: string) {
    try {
      const fileName = destination || `profile/${Date.now()}_${uuidv4()}_${file.originalname}`;
      const bucket = this.storage.bucket(this.bucketName);
      const gcsFile = bucket.file(fileName);

      await gcsFile.save(file.buffer, {
        contentType: file.mimetype,
      });

      return `https://storage.googleapis.com/${this.bucketName}/${gcsFile.name}`;
    } catch (error) {
      this.logger.error('GCS 파일 업로드 실패', error.stack || error);
      // 정책에 따라 예외 throw 또는 기본 이미지 반환
      return this.appConfigService.defaultAvatar;
    }
  }

  async uploadFile(file: Express.Multer.File, destination?: string) {
    try {
      const fileName = destination || `profile/${Date.now()}_${uuidv4()}_${file.originalname}`;
      const bucket = this.storage.bucket(this.bucketName);
      const gcsFile = bucket.file(fileName);

      await gcsFile.save(file.buffer, {
        contentType: file.mimetype,
      });

      return `https://storage.googleapis.com/${this.bucketName}/${gcsFile.name}`;
    } catch (error) {
      this.logger.error('GCS 파일 업로드 실패', error.stack || error);
      throw error;
    }
  }

  async uploadTextAsFile(
    content: string,
    filename?: string,
  ) {
    try {
      const fileName = filename ?? `documents/${Date.now()}_${uuidv4()}.txt`;
      const bucket = this.storage.bucket(this.bucketName);
      const gcsFile = bucket.file(fileName);

      await gcsFile.save(content, { contentType: 'text/plain' });

      return {
        fileUrl: `https://storage.googleapis.com/${this.bucketName}/${gcsFile.name}`,
        fileName: fileName.split('/').pop(),
        mimeType: 'text/plain',
        fileSize: Buffer.byteLength(content),
      };
    } catch (error) {
      this.logger.warn('GCS 파일 삭제 실패', error);
      throw error;
    }
  }

  async generateThumbnail(
    file: Express.Multer.File,
    fileId: string,
  ): Promise<string> {
    return `https://storage.googleapis.com/thumbnails/${fileId}.png`;
  }

  async deleteFile(fileUrl: string) {
    try {
      const filePath = fileUrl.split(`/${this.bucketName}/`)[1];
      if (!filePath) return;
      await this.storage.bucket(this.bucketName).file(filePath).delete();
    } catch (error) {
      this.logger.warn('GCS 파일 삭제 실패', error);
      throw error;
    }
  }
}