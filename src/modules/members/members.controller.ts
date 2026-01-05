// src/modules/member/member.controller.ts
import { Controller, Post, Body, Patch, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateMemberRequestDto } from './dto/create-member-request.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { SearchMembersDto } from './dto/search-members.dto';

@ApiTags('members')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('members')
export class MembersController {
  constructor(private readonly memberService: MembersService) {}

  @Post('request')
  async sendFriendRequest(
    @RequestUser() user: User,
    @Body() dto: CreateMemberRequestDto,
  ) {
    const result = await this.memberService.sendFriendRequest(user.id, dto.recipientEmail);
    return { success: true, message: '친구 요청이 전송되었습니다.', data: result };
  }

  @Patch('accept')
  async acceptFriendRequest(
    @RequestUser() user: User,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    const result = await this.memberService.acceptFriendRequest(dto.memberId, user.id);
    return { success: true, message: '친구 요청이 수락되었습니다.', data: result };
  }

  @Delete('remove')
  async removeFriend(
    @RequestUser() user: User,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    await this.memberService.removeFriend(dto.memberId, user.id);
    return { success: true, message: '친구가 삭제되었습니다.' };
  }

  @Patch('block')
  async blockFriend(
    @RequestUser() user: User,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    const result = await this.memberService.blockFriend(dto.memberId, user.id);
    return { success: true, message: '친구가 차단되었습니다.', data: result };
  }

  @Get('list')
  async getFriends(@RequestUser() user: User) {
    const friends = await this.memberService.getFriends(user.id);
    return { success: true, data: friends };
  }

  @Get('requests')
  async getPendingRequests(@RequestUser() user: User) {
    const requests = await this.memberService.getPendingRequests(user.id);
    return { success: true, data: requests };
  }

  @Get('search')
  async searchFriends(
    @RequestUser() user: User,
    @Query() query: SearchMembersDto,
  ) {
    const results = await this.memberService.searchFriends(user.id, query.keyword);
    return { success: true, data: results };
  }
}