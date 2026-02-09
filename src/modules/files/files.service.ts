// src/modules/files/files.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { GcsService } from '../gcs/gcs.service';
import { FileStatus } from './constants/file-status.enum';
import { FileType } from './constants/file-type.enum';
import { User } from '../users/entities/user.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { FileFolder } from './entities/file-folder.entity';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    @InjectRepository(FileFolder)
    private readonly folderRepo: Repository<FileFolder>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly gcsService: GcsService,
  ) {}

  private async assertProjectMember(projectId: string, userId: string) {
    const member = await this.projectMemberRepo.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!member) {
      throw new ForbiddenException('프로젝트 멤버가 아닙니다.');
    }
  }

  private detectTypeByNameAndMime(fileName: string, mime: string): FileType {
    if (mime.startsWith('image/')) return FileType.IMAGE;
    if (mime.startsWith('text/') || fileName.toLowerCase().endsWith('.md') || fileName.toLowerCase().endsWith('.pdf')) {
      return FileType.DOCUMENT;
    }
    return FileType.FILE;
  }

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

  async createFolder(projectId: string, name: string, user: User) {
    await this.assertProjectMember(projectId, user.id);
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    const folder = this.folderRepo.create({
      name,
      project,
    });
    return this.folderRepo.save(folder);
  }

  async listFolders(projectId: string, user: User) {
    await this.assertProjectMember(projectId, user.id);
    return this.folderRepo.find({
      where: { project: { id: projectId } },
      order: { createdAt: 'ASC' },
    });
  }

  async updateFolder(folderId: string, name: string, user: User) {
    const folder = await this.folderRepo.findOne({
      where: { id: folderId },
      relations: ['project'],
    });
    if (!folder) {
      throw new NotFoundException('폴더를 찾을 수 없습니다.');
    }
    await this.assertProjectMember(folder.project.id, user.id);
    folder.name = name;
    return this.folderRepo.save(folder);
  }

  async removeFolder(folderId: string, user: User) {
    const folder = await this.folderRepo.findOne({
      where: { id: folderId },
      relations: ['project'],
    });
    if (!folder) {
      throw new NotFoundException('폴더를 찾을 수 없습니다.');
    }
    await this.assertProjectMember(folder.project.id, user.id);
    await this.folderRepo.delete(folderId);
    return { ok: true };
  }

  async uploadProjectFile(
    projectId: string,
    file: Express.Multer.File,
    user: User,
    folderId?: string,
  ): Promise<File> {
    await this.assertProjectMember(projectId, user.id);
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    let folder: FileFolder | null = null;
    if (folderId) {
      folder = await this.folderRepo.findOne({
        where: { id: folderId, project: { id: projectId } },
      });
      if (!folder) {
        throw new NotFoundException('폴더를 찾을 수 없습니다.');
      }
    }

    const entity = this.fileRepo.create({
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy: user,
      type: this.detectTypeByNameAndMime(file.originalname, file.mimetype),
      status: FileStatus.PENDING,
      project,
      folder,
    });

    await this.fileRepo.save(entity);

    try {
      const fileUrl = await this.gcsService.uploadFile(
        file,
        `projects/${projectId}/files/${entity.id}/${file.originalname}`,
      );

      const thumbnailUrl =
        entity.type === FileType.IMAGE
          ? await this.gcsService.generateThumbnail(file, entity.id)
          : undefined;

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

  async listProjectFiles(projectId: string, user: User, folderId?: string) {
    await this.assertProjectMember(projectId, user.id);
    const qb = this.fileRepo.createQueryBuilder('file')
      .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
      .leftJoinAndSelect('file.folder', 'folder')
      .where('file.projectId = :projectId', { projectId })
      .andWhere('file.status = :status', { status: FileStatus.DONE })
      .orderBy('file.createdAt', 'DESC');

    if (folderId) {
      qb.andWhere('file.folderId = :folderId', { folderId });
    }

    return qb.getMany();
  }

  async removeProjectFile(fileId: string, user: User) {
    const file = await this.fileRepo.findOne({
      where: { id: fileId },
      relations: ['project'],
    });
    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }
    if (!file.project?.id) {
      throw new ForbiddenException('프로젝트 파일이 아닙니다.');
    }
    await this.assertProjectMember(file.project.id, user.id);
    await this.fileRepo.delete(fileId);
    return { ok: true };
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
