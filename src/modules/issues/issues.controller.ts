// src/modules/issue/issue.controller.ts
import { Controller, Post, Param, Body, Patch, Get } from '@nestjs/common';
import { IssueService } from './issues.service';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignIssueDto } from './dto/assign-issue.dto';
import { IssueResponseDto } from './dto/issue-response.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('issues')
@Controller('project/:projectId/issue')
export class IssueController {
  constructor(
    private readonly issueService: IssueService
  ) {}

  @ApiOperation({ summary: '이슈 추가'})
  @ApiCreatedResponse({ type: IssueResponseDto })
  @Post()
  create(
    @Param('projectId') projectId: string,
    @RequestUser() user: User,
    @Body() createIssueDto: CreateIssueDto
  ) {
    return this.issueService.createIssue(projectId, createIssueDto, user);
  }

  @ApiOperation({ summary: '이슈 수정'})
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId')
  update(
    @Param('issueId') issueId: string,
    @Body() updateIssueDto: UpdateIssueDto
  ) {
    return this.issueService.updateIssue(issueId, updateIssueDto);
  }

  @ApiOperation({ summary: '담당자 지정'})
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId/assign')
  assign(
    @Param('issueId') issueId: string,
    @Body() assignIssueDto: AssignIssueDto
  ) {
    return this.issueService.assignIssue(issueId, assignIssueDto.userId);
  }

  @ApiOperation({ summary: '프로젝트 이슈 목록' })
  @ApiOkResponse({ type: [IssueResponseDto] })
  @Get()
  getProjectIssues(
    @Param('projectId') projectId: string
  ) {
    return this.issueService.getProjectIssues(projectId);
  }

  @ApiOperation({ summary: '커멘트 추가'})
  @Post(':issueId/comment')
  addComment(
    @Param('issueId') issueId: string,
    @RequestUser() user: User,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.issueService.addComment(issueId, user, createCommentDto.content);
  }

  @ApiOperation({ summary: '진행률 수정'})
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId/progress')
  updateProgress(
    @Param('issueId') issueId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.issueService.updateProgress(issueId, updateProgressDto);
  }

  @ApiOperation({ summary: '상태 변경' })
  @ApiOkResponse({ type: IssueResponseDto })
  @Patch(':issueId/status')
  updateStatus(
    @Param('issueId') issueId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.issueService.updateStatus(issueId, dto.status);
  }
}