// src/modules/member/member.controller.ts
import { Controller, Post, Body, Patch, Delete, Get, Query, UseGuards, Param } from '@nestjs/common';
import { MembersService } from './members.service';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMemberRequestDto } from './dto/create-member-request.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { SearchMembersDto } from './dto/search-members.dto';

@ApiTags('members')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @ApiOperation({ summary: '친구 요청' })
  @Post('request')
  async sendMemberRequest(
    @RequestUser() user: User,
    @Body() dto: CreateMemberRequestDto,
  ) {
    const result = await this.membersService.sendMemberRequest(user.id, dto.recipientEmail);
    return { success: true, message: '친구 요청이 전송되었습니다.', data: result };
  }

  @ApiOperation({ summary: '친구 수락' })
  @Patch('accept')
  async acceptMemberRequest(
    @RequestUser() user: User,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    const result = await this.membersService.acceptMemberRequest(dto.memberId, user.id);
    return { success: true, message: '친구 요청이 수락되었습니다.', data: result };
  }

  @ApiOperation({ summary: '친구 삭제' })
  @Delete('remove')
  async removeMember(
    @RequestUser() user: User,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    await this.membersService.removeMember(dto.memberId, user.id);
    return { success: true, message: '친구가 삭제되었습니다.' };
  }

  @ApiOperation({ summary: '친구 요청 취소' })
  @Delete('requests/:id/cancel')
  cancelRequest(
    @Param('id') memberId: string,
    @RequestUser() user: User,
  ) {
    return this.membersService.cancelMemberRequest(memberId, user.id);
  }

  @ApiOperation({ summary: '친구 차단' })
  @Patch('block')
  async blockMember(
    @RequestUser() user: User,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    const result = await this.membersService.blockMember(dto.memberId, user.id);
    return { success: true, message: '친구가 차단되었습니다.', data: result };
  }

  @ApiOperation({ summary: '친구 리스트' })
  @Get('list')
  async getMembers(@RequestUser() user: User) {
    const Members = await this.membersService.getMembers(user.id);
    return { success: true, data: Members };
  }

  @ApiOperation({ summary: '친구 요청 목록' })
  @Get('requests')
  async getPendingRequests(@RequestUser() user: User) {
    const requests = await this.membersService.getPendingRequests(user.id);
    return { success: true, data: requests };
  }

  @ApiOperation({ summary: '친구 찾기' })
  @Get('search')
  async searchMembers(
    @RequestUser() user: User,
    @Query() query: SearchMembersDto,
  ) {
    const results = await this.membersService.searchMembers(user.id, query.keyword);
    return { success: true, data: results };
  }
}