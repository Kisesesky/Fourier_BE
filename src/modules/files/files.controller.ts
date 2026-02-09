// src/modules/files/files.controller.ts
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFileFolderDto } from './dto/create-file-folder.dto';
import { UpdateFileFolderDto } from './dto/update-file-folder.dto';

@ApiTags('files')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
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

  @Get('folders')
  async listFolders(
    @Query('projectId') projectId: string,
    @RequestUser() user: User,
  ) {
    if (!projectId) throw new BadRequestException('projectId is required');
    return this.filesService.listFolders(projectId, user);
  }

  @Post('folder')
  async createFolder(
    @Body() dto: CreateFileFolderDto,
    @RequestUser() user: User,
  ) {
    return this.filesService.createFolder(dto.projectId, dto.name, user);
  }

  @Patch('folder/:id')
  async updateFolder(
    @Param('id') folderId: string,
    @Body() dto: UpdateFileFolderDto,
    @RequestUser() user: User,
  ) {
    return this.filesService.updateFolder(folderId, dto.name, user);
  }

  @Delete('folder/:id')
  async deleteFolder(
    @Param('id') folderId: string,
    @RequestUser() user: User,
  ) {
    return this.filesService.removeFolder(folderId, user);
  }

  @Get()
  async listProjectFiles(
    @Query('projectId') projectId: string,
    @Query('folderId') folderId: string | undefined,
    @RequestUser() user: User,
  ) {
    if (!projectId) throw new BadRequestException('projectId is required');
    return this.filesService.listProjectFiles(projectId, user, folderId);
  }

  @Post('project/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProjectFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
    @Body('folderId') folderId: string | undefined,
    @RequestUser() user: User,
  ) {
    if (!projectId) throw new BadRequestException('projectId is required');
    const uploaded = await this.filesService.uploadProjectFile(projectId, file, user, folderId || undefined);
    return {
      id: uploaded.id,
      name: uploaded.fileName,
      fileUrl: uploaded.fileUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
      mimeType: uploaded.mimeType,
      size: Number(uploaded.fileSize),
      createdAt: uploaded.createdAt,
      folderId: uploaded.folder?.id ?? null,
    };
  }

  @Delete(':id')
  async removeProjectFile(
    @Param('id') fileId: string,
    @RequestUser() user: User,
  ) {
    return this.filesService.removeProjectFile(fileId, user);
  }
}
