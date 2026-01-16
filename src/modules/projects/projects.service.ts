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
import { Channel } from '../chat/entities/channel.entity';
import { ChannelMember } from '../chat/entities/channel-member.entity';
import { CalendarService } from '../calendar/calendar.service';
import { DocsService } from '../docs/docs.service';
import { IssuesService } from '../issues/issues.service';
import { IssueStatus } from '../issues/constants/issue-status.enum';
import { CalendarCategory } from '../calendar/entities/calendar-category.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(CalendarCategory)
    private readonly calendarCategoryRepository: Repository<CalendarCategory>,
    private readonly calendarService: CalendarService,
    private readonly docsService: DocsService,
    private readonly issuesService: IssuesService,
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
    if (!creatorTeamMember) {
      throw new ForbiddenException('팀 멤버 아님');
    }

    // 2. 프로젝트 생성
    const project = this.projectRepository.create({
      ...createProjectDto,
      team: creatorTeamMember.team,
    });
    await this.projectRepository.save(project);

    // 3. 생성자는 자동 OWNER
    const ownerMember = await this.projectMemberRepository.create({
      project,
      user,
      role: ProjectRole.OWNER,
    });

    await this.projectMemberRepository.save(ownerMember);

    // 4. 선택된 유저들 자동 추가 (팀 멤버만)
    const teamMembers =
      selectedUserIds.length > 0
        ? await this.teamMemberRepository.find({
            where: { team: { id: teamId }, user: { id: In(selectedUserIds) } },
          })
        : [];
    
    const projectMembers = [ownerMember, ...teamMembers.map(teammember => ({
      project,
      user: teammember.user,
      role: ProjectRole.MEMBER,
    }))];

    for (const member of projectMembers) {
      const exists = await this.projectMemberRepository.findOne({
        where: { project: { id: project.id }, user: { id: member.user.id } },
      });
      if (!exists) {
        await this.projectMemberRepository.save(member);
      }
    }

    // 5. 프로젝트 기본 채널 가져오기 / 생성
    let defaultChannel = await this.channelRepository.findOne({
      where: { project: { id: project.id }, isDefault: true },
    });
    if (!defaultChannel) {
      defaultChannel = await this.channelRepository.save(
        this.channelRepository.create({
          name: 'general',
          project,
          isDefault: true,
        }),
      );
    }

    // 6. 채널에 프로젝트 멤버 자동 참여
    for (const member of projectMembers) {
      const exists = await this.channelMemberRepository.findOne({
        where: { channel: { id: defaultChannel.id }, user: { id: member.user.id } },
      });
      if (!exists) {
        await this.channelMemberRepository.save(
          this.channelMemberRepository.create({
            channel: defaultChannel,
            user: member.user,
          }),
        );
      }
    }

    // 7. 캘린더 기본 이벤트 생성
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1시간 기본
    const defaultCategories = [
      { name: '일정', color: '#3788d8', isDefault: true },
      { name: '회의', color: '#2ecc71' },
      { name: '마감', color: '#e74c3c' },
      { name: '개인', color: '#9b59b6' },
    ];

    const savedCategories = await this.calendarCategoryRepository.save(
      defaultCategories.map(c => ({
        ...c,
        project,
      }))
    );

    const defaultCategory = savedCategories.find(c => c.isDefault);

    await this.calendarService.createEvent(project.id, {
      title: '프로젝트 시작',
      categoryId: defaultCategory.id,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    }, user);

    // 8. Docs 루트 폴더/문서 생성
    const rootFolder = await this.docsService.createFolder({
      name: 'Docs',
    }, user);

    await this.docsService.createDocument({
      title: '첫 문서',
      content: '프로젝트 문서 작성 시작',
      folderId: rootFolder.id,
    }, user);

    // 9. Issue 기본 업무 생성
    const starts = new Date();
    const ends = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // 1주 기본

    const issue = await this.issuesService.createIssue(project.id, {
      title: '첫 업무',
      progress: 0,
      status: IssueStatus.PLANNED,
      startAt: starts.toISOString(),
      endAt: ends.toISOString(),
    }, user);


    return project;
  }

  /** 프로젝트 멤버 추가 */
  async addProjectMember(projectId: string, userId: string, role: ProjectRole) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['team', 'channels'],
    });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }

    // 팀 멤버만 추가 가능
    const teamMember = await this.teamMemberRepository.findOne({
      where: { team: { id: project.team.id }, user: { id: userId } },
    });
    if (!teamMember) {
      throw new ForbiddenException('팀 멤버만 추가 가능');
    }

    const exists = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (exists) {
      throw new ConflictException('이미 프로젝트 멤버');
    }

    const newMember = await this.projectMemberRepository.save(
      this.projectMemberRepository.create({
        project: { id: projectId } as Project,
        user: { id: userId } as User,
        role
      }),
    );

    // 프로젝트 기본 채널에 자동 참여
    const defaultChannel = project.channels.find(c => c.isDefault);
    if (defaultChannel) {
      const channelExists = await this.channelMemberRepository.findOne({
        where: { channel: { id: defaultChannel.id }, user: { id: userId } },
      });
      if (!channelExists) {
        await this.channelMemberRepository.save(
          this.channelMemberRepository.create({
            channel: defaultChannel,
            user: { id: userId } as User,
          }),
        );
      }
    }

    return newMember;
  }

  /** 프로젝트 멤버 목록 조회 */
  async getProjectMembers(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user'],
    });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }

    return project.members.map((member) => ({
      userId: member.user.id,
      name: member.user.displayName ?? member.user.name,
      role: member.role,
    }));
  }

  /** 프로젝트 멤버 역할 변경 */
  async updateMemberRole(projectId: string, userId: string, newRole: ProjectRole) {
    const member = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!member) {
      throw new NotFoundException('프로젝트 멤버 없음');
    }

    member.role = newRole;
    return this.projectMemberRepository.save(member);
  }

  /** 프로젝트 멤버 제거 */
  async removeMember(projectId: string, userId: string) {
    const member = await this.projectMemberRepository.findOne({
      where: { project: { id: projectId }, user: { id: userId } },
    });
    if (!member) {
      throw new NotFoundException('프로젝트 멤버 없음');
    }

    return this.projectMemberRepository.remove(member);
  }

  /** 프로젝트 정보 업데이트 (이름, 설명, 아이콘) */
  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('프로젝트 없음');
    }

    if (updateProjectDto.name !== undefined) project.name = updateProjectDto.name;
    if (updateProjectDto.description !== undefined) project.description = updateProjectDto.description;
    if (updateProjectDto.iconType !== undefined) project.iconType = updateProjectDto.iconType;
    if (updateProjectDto.iconValue !== undefined) project.iconValue = updateProjectDto.iconValue;

    return this.projectRepository.save(project);
  }
}