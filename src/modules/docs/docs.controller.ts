// src/modules/docs/docs.controller.ts
import { Controller, Post, Patch, Delete, Param, Body, Query, Get, UseGuards } from '@nestjs/common';
import { DocsService } from './docs.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocPermissionGuard } from './guards/doc-permission.guard';
import { DocumentResponseDto } from './dto/document-response.dto';
import { FolderResponseDto } from './dto/folder-response.dto';
import { RequireDocPermission } from './decorators/require-doc-permission.decorator';
import { DocPermission } from './constants/doc-permission.enum';
import { UpdateDocPermissionDto } from './dto/update-document-permission.dto';

@ApiTags('docs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, DocPermissionGuard)
@Controller('docs')
export class DocsController {
  constructor(
    private readonly docsService: DocsService
  ) {}

  @ApiOperation({ summary: '폴더 생성'})
  @ApiOkResponse({ type: FolderResponseDto })
  @Post('folder')
  createFolder(
    @Body() createFolderDto: CreateFolderDto,
    @RequestUser() user: User
  ) {
    return this.docsService.createFolder(createFolderDto, user);
  }

  @ApiOperation({ summary: '폴더 이동'})
  @Patch('folder/:id/move')
  moveFolder(
    @Param('id') id: string,
    @Body('parentId') parentId?: string
  ) {
    return this.docsService.moveFolder(id, parentId);
  }

  @ApiOperation({ summary: '폴더 삭제'})
  @Delete('folder/:id')
  removeFolder(
    @Param('id') id: string
  ) {
    return this.docsService.removeFolder(id);
  }

  @ApiOperation({ summary: '문서 생성'})
  @ApiOkResponse({ type: DocumentResponseDto })
  @Post('document')
  createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @RequestUser() user: User
  ) {
    return this.docsService.createDocument(createDocumentDto, user);
  }

  @ApiOperation({ summary: '문서 수정'})
  @ApiOkResponse({ description: '문서 수정 성공' })
  @Patch('document/:id')
  updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @RequestUser() user: User
  ) {
    return this.docsService.updateDocument(id, updateDocumentDto, user);
  }

  @ApiOperation({ summary: '문서 삭제'})
  @Delete('document/:id')
  removeDocument(
    @Param('id') id: string
  ) {
    return this.docsService.removeDocument(id);
  }

  @ApiOperation({ summary: '문서 검색'})
  @ApiQuery({ name: 'q', example: '회의' })
  @Get('search')
  search(
    @Query('q') q: string,
    @RequestUser() user: User,
  ) {
    return this.docsService.searchDocs(user.id, q);
  }

  @ApiOperation({
    summary: '문서 멤버 권한 변경',
    description: 'ADMIN 권한 필요',
  })
  @RequireDocPermission(DocPermission.ADMIN)
  @Patch('document/:id/permission')
  updateDocumentPermission(
    @Param('id') documentId: string,
    @Body() dto: UpdateDocPermissionDto,
  ) {
    return this.docsService.updateDocumentPermission(documentId, dto);
  }
}