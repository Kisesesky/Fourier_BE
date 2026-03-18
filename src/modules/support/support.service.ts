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

  async createInquiry(createSupportInquiryDto: CreateSupportInquiryDto, user: User) {
    const project = await this.projectRepository.findOne({
      where: { id: createSupportInquiryDto.projectId },
      relations: ['team'],
    });
    if (!project) {
      throw new BadRequestException('project not found');
    }
    if (project.team.id !== createSupportInquiryDto.teamId) {
      throw new BadRequestException('team/project mismatch');
    }

    const membership = await this.projectMemberRepository.findOne({
      where: { project: { id: createSupportInquiryDto.projectId }, user: { id: user.id } },
    });
    if (!membership) {
      throw new ForbiddenException('project member only');
    }

    const inquiry = this.supportInquiryRepository.create({
      team: { id: createSupportInquiryDto.teamId } as Team,
      project: { id: createSupportInquiryDto.projectId } as Project,
      requester: { id: user.id } as User,
      message: createSupportInquiryDto.message.trim(),
      status: 'OPEN',
      source: 'FLOATING_WIDGET',
    });

    const saved = await this.supportInquiryRepository.save(inquiry);

    return {
      id: saved.id,
      status: saved.status,
      createdAt: saved.createdAt,
      teamId: createSupportInquiryDto.teamId,
      projectId: createSupportInquiryDto.projectId,
      requesterId: user.id,
    };
  }
}
