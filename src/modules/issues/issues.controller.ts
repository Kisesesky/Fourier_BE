// src/modules/issue/issue.controller.ts
import { Controller, Post, Param, Body, Patch, Get, UseGuards } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignIssueDto } from './dto/assign-issue.dto';
import { IssueResponseDto } from './dto/issue-response.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddSubtaskDto } from './dto/add-subtask.dto';

@ApiTags('issues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/issues')
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService,
  ) {}

  @ApiOperation({ summary: '이슈 추가'})
  @ApiCreatedResponse({ type: IssueResponseDto })
  @Post()
  createIssue(
    @Param('projectId') projectId: string,
    @RequestUser() user: User,
    @Body() createIssueDto: CreateIssueDto,
  ) {
    return this.issuesService.createIssue(projectId, createIssueDto, user);
  }

  @ApiOperation({ summary: '이슈 수정'})
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId')
  updateIssue(
    @Param('issueId') issueId: string,
    @Body() updateIssueDto: UpdateIssueDto,
    @RequestUser() user: User,
  ) {
    return this.issuesService.updateIssue(issueId, updateIssueDto, user);
  }

  @ApiOperation({ summary: '담당자 지정'})
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId/assign')
  assignIssue(
    @Param('issueId') issueId: string,
    @Body() assignIssueDto: AssignIssueDto,
    @RequestUser() user: User,
  ) {
    return this.issuesService.assignIssue(issueId, assignIssueDto.userId, user);
  }

  @ApiOperation({ summary: '진행률 수정'})
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId/progress')
  updateProgress(
    @Param('issueId') issueId: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @RequestUser() user: User,
  ) {
    return this.issuesService.updateProgress(issueId, updateProgressDto, user);
  }

  @ApiOperation({ summary: '상태 변경' })
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId/status')
  updateStatus(
    @Param('issueId') issueId: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @RequestUser() user: User
  ) {
    return this.issuesService.updateStatus(issueId, updateStatusDto.status, user);
  }

  @ApiOperation({ summary: '댓글 추가'})
  @Post(':issueId/comment')
  addComment(
    @Param('issueId') issueId: string,
    @RequestUser() user: User,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.issuesService.addComment(issueId, user, createCommentDto.content);
  }

  @ApiOperation({ summary: '하위 업무 추가' })
  @Post('subtask')
  addSubtask(
    @Body() addSubtaskDto: AddSubtaskDto,
    @RequestUser() user: User,
  ) {
    return this.issuesService.addSubtask(addSubtaskDto, user);
  }

  @ApiOperation({ summary: '프로젝트 이슈 목록' })
  @ApiOkResponse({ type: [IssueResponseDto] })
  @Get()
  getProjectIssues(
    @Param('projectId') projectId: string,
  ) {
    return this.issuesService.getProjectIssues(projectId);
  }

  @ApiOperation({ summary: '프로젝트 Kanban 보드' })
  @Get('board')
  async getProjectBoard(
    @Param('projectId') projectId: string,
  ) {
    return this.issuesService.getProjectBoard(projectId);
  }

  @ApiOperation({ summary: '프로젝트 대시보드 통계' })
  @Get('dashboard')
  async getProjectDashboard(
    @Param('projectId') projectId: string,
  ) {
    return this.issuesService.getProjectDashboard(projectId);
  }

  @ApiOperation({ summary: '프로젝트 gantt 조회' })
  @Get('gantt')
  getProjectGantt(
    @Param('projectId') projectId: string,
  ) {
    return this.issuesService.getProjectGantt(projectId);
  }
}