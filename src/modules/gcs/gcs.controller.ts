// src/modules/gcs/gcs.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GcsService } from 'src/modules/gcs/gcs.service';

@ApiTags('files')
@Controller('files')
export class GcsServiceController {
  constructor(private readonly gcsService: GcsService) {}

  @Post('upload')
  @ApiOperation({ summary: '이미지 업로드(GCS)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '업로드할 이미지 파일',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
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
    const url = await this.gcsService.uploadFile(file);
    return { url };
  }
}