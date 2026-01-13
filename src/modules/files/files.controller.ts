// src/modules/files/files.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @RequestUser() user: User,
  ) {
    const uploaded = await this.filesService.upload(file, user);

    return {
      fileId: uploaded.id,
      status: uploaded.status,
      fileUrl: uploaded.fileUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
    };
  }
}