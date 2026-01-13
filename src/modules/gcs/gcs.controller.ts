// src/modules/gcs/gcs.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GcsService } from 'src/modules/gcs/gcs.service';

@ApiTags('gcs')
@Controller('files')
export class GcsServiceController {
  constructor(private readonly gcsService: GcsService) {}

  @ApiOperation({ summary: '이미지 업로드(GCS)' })
  @Post('upload/images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('이미지 파일만 업로드할 수 있습니다.'), false);
      }
      cb(null, true);
    },
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('업로드된 파일이 없습니다.');
    }
    const url = await this.gcsService.uploadImageFile(file);
    return { url };
  }

  @ApiOperation({ summary: '파일 업로드(GCS)' })
  @Post('upload/files')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
    fileFilter: (req, file, cb) => { cb(null, true) },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('업로드된 파일이 없습니다.');
    }
    const url = await this.gcsService.uploadFile(file);
    return { url };
  }
}