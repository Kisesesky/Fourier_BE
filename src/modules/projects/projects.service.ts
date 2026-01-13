// src/modules/project/project.service.ts
import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { TeamMember } from '../team/entities/team-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRole } from './constants/project-role.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
  ) {}

  /** 프로젝트 생성 */
  async createProject(
    teamId: string,
    createProjectDto: CreateProjectDto,
    user: User,
  ) {
    const { selectedUserIds = [] } = createProjectDto;
    // 1. 팀 멤버 확인
    const creatorTeamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: teamId }, user: { id: user.id } },
      relations: ['team'],
    });
    if (!creatorTeamMember) throw new ForbiddenException('팀 멤버 아님');

    // 2. 프로젝트 생성
    const project = this.projectRepository.create({
      ...createProjectDto,
      team: creatorTeamMember.team,
    });
    await this.projectRepository.save(project);

    // 3. 생성자는 자동 OWNER
    await this.projectMemberRepository.save(
      this.projectMemberRepository.create({
        project: { id: project.id } as Project,
        user: { id: user.id } as User,
        role: ProjectRole.OWNER,
      }),
    );

    // 4. 선택된 유저들 자동 추가 (팀 멤버만)
    if (selectedUserIds.length > 0) {
      const teamMembers = await this.teamMemberRepository.find({
        where: { team: { id: teamId }, user: { id: In(selectedUserIds) } },
      });

      for (const member of teamMembers) {
        const exists = await this.projectMemberRepository.findOne({
          where: { project: { id: project.id }, user: { id: member.user.id } },
        });
        if (!exists) {
          await this.projectMemberRepository.save(
            this.projectMemberRepository.create({
              project,
              user: member.user,
              role: ProjectRole.MEMBER,
            }),
          );
        }
      }
    }

    return project;
  }

  /** 프로젝트 멤버 추가 */
  async addProjectMember(projectId: string, userId: string, role: ProjectRole) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['team'],
    });
    if (!project) throw new NotFoundException('프로젝트 없음');

    // 팀 멤버만 추가 가능
    const teamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: project.team.id }, user: { id: userId } },
    });
    if (!teamMember) throw new ForbiddenException('팀 멤버만 추가 가능');

    const exists = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (exists) throw new ConflictException('이미 프로젝트 멤버');

    return this.projectMemberRepository.save(
      this.projectMemberRepository.create({
        project: { id: projectId } as Project,
        user: { id: userId } as User,
        role
      }),
    );
  }

  /** 프로젝트 멤버 목록 조회 */
  async getProjectMembers(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user'],
    });
    if (!project) throw new NotFoundException('프로젝트 없음');

    return project.members.map((m) => ({
      userId: m.user.id,
      name: m.user.displayName ?? m.user.name,
      role: m.role,
    }));
  }

  /** 프로젝트 멤버 역할 변경 */
  async updateMemberRole(projectId: string, userId: string, newRole: ProjectRole) {
    const member = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!member) throw new NotFoundException('프로젝트 멤버 없음');

    member.role = newRole;
    return this.projectMemberRepository.save(member);
  }

  /** 프로젝트 멤버 제거 */
  async removeMember(projectId: string, userId: string) {
    const member = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!member) throw new NotFoundException('프로젝트 멤버 없음');

    return this.projectMemberRepository.remove(member);
  }

  /** 프로젝트 정보 업데이트 (이름, 설명, 아이콘) */
  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('프로젝트 없음');

    if (updateProjectDto.name !== undefined) project.name = updateProjectDto.name;
    if (updateProjectDto.description !== undefined) project.description = updateProjectDto.description;
    if (updateProjectDto.iconType !== undefined) project.iconType = updateProjectDto.iconType;
    if (updateProjectDto.iconValue !== undefined) project.iconValue = updateProjectDto.iconValue;

    return this.projectRepository.save(project);
  }
}