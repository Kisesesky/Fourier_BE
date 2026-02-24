import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { SupportInquiry } from './entities/support-inquiry.entity';
import { Team } from '../team/entities/team.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateSupportInquiryDto } from './dto/create-support-inquiry.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportInquiry)
    private readonly supportInquiryRepository: Repository<SupportInquiry>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  async createInquiry(dto: CreateSupportInquiryDto, user: User) {
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
      relations: ['team'],
    });
    if (!project) {
      throw new BadRequestException('project not found');
    }
    if (project.team.id !== dto.teamId) {
      throw new BadRequestException('team/project mismatch');
    }

    const membership = await this.projectMemberRepository.findOne({
      where: { project: { id: dto.projectId }, user: { id: user.id } },
    });
    if (!membership) {
      throw new ForbiddenException('project member only');
    }

    const inquiry = this.supportInquiryRepository.create({
      team: { id: dto.teamId } as Team,
      project: { id: dto.projectId } as Project,
      requester: { id: user.id } as User,
      message: dto.message.trim(),
      status: 'OPEN',
      source: 'FLOATING_WIDGET',
    });

    const saved = await this.supportInquiryRepository.save(inquiry);

    return {
      id: saved.id,
      status: saved.status,
      createdAt: saved.createdAt,
      teamId: dto.teamId,
      projectId: dto.projectId,
      requesterId: user.id,
    };
  }
}
