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
import { IssueStatus } from './constants/issue-status.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddSubtaskDto } from './dto/add-subtask.dto';

@ApiTags('issues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/issues')
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService
  ) {}

  @ApiOperation({ summary: '이슈 추가'})
  @ApiCreatedResponse({ type: IssueResponseDto })
  @Post()
  create(
    @Param('projectId') projectId: string,
    @RequestUser() user: User,
    @Body() createIssueDto: CreateIssueDto
  ) {
    return this.issuesService.createIssue(projectId, createIssueDto, user);
  }

  @ApiOperation({ summary: '이슈 수정'})
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId')
  update(
    @Param('issueId') issueId: string,
    @Body() updateIssueDto: UpdateIssueDto
  ) {
    return this.issuesService.updateIssue(issueId, updateIssueDto);
  }

  @ApiOperation({ summary: '담당자 지정'})
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId/assign')
  assign(
    @Param('issueId') issueId: string,
    @Body() assignIssueDto: AssignIssueDto
  ) {
    return this.issuesService.assignIssue(issueId, assignIssueDto.userId);
  }

  @ApiOperation({ summary: '프로젝트 이슈 목록' })
  @ApiOkResponse({ type: [IssueResponseDto] })
  @Get()
  getProjectIssues(
    @Param('projectId') projectId: string
  ) {
    return this.issuesService.getProjectIssues(projectId);
  }

  @ApiOperation({ summary: '커멘트 추가'})
  @Post(':issueId/comment')
  addComment(
    @Param('issueId') issueId: string,
    @RequestUser() user: User,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.issuesService.addComment(issueId, user, createCommentDto.content);
  }

  @ApiOperation({ summary: '진행률 수정'})
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId/progress')
  updateProgress(
    @Param('issueId') issueId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.issuesService.updateProgress(issueId, updateProgressDto);
  }

  @ApiOperation({ summary: '상태 변경' })
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId/status')
  updateStatus(
    @Param('issueId') issueId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.issuesService.updateStatus(issueId, dto.status);
  }

  @ApiOperation({ summary: 'Kanban board 상태 변경' })
  @Patch(':id/status')
  async changeStatus(
    @Param('id') issueId: string,
    @Body('status') status: IssueStatus
  ) {
    return this.issuesService.changeStatus(issueId, status);
  }

  @ApiOperation({ summary: '프로젝트 Kanban 보드' })
  @Get('board')
  async getBoard(
    @Param('projectId') projectId: string
  ) {
    return this.issuesService.getProjectBoard(projectId);
  }

  @ApiOperation({ summary: '프로젝트 대시보드 통계' })
  @Get('dashboard')
  async getDashboard(
    @Param('projectId') projectId: string
  ) {
    return this.issuesService.getProjectDashboard(projectId);
  }

  @ApiOperation({ summary: '하위 업무' })
  @Post('subtask')
  addSubtask(
    @Body() addSubtaskDto: AddSubtaskDto
  ) {
    return this.issuesService.addSubtask(addSubtaskDto);
  }
}