// src/modules/member/member.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { UsersService } from '../users/users.service';
import { MemberStatus } from './constants/member-status.enum';
import { TeamMember } from '../team/entities/team-member.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/constants/notification-type.enum';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
    private usersService: UsersService,
    private notificationService: NotificationService,
  ) {}

  private normalizeMember(
    member: Member,
    myUserId: string,
    sharedTeams: Array<{ id: string; name: string }> = [],
  ) {
    const isRequester = member.requester.id === myUserId;
    const otherUser = isRequester ? member.recipient : member.requester;

    return {
      memberId: member.id,
      userId: otherUser.id,
      displayName: otherUser.displayName ?? otherUser.name,
      avatarUrl: otherUser.avatarUrl,
      status: member.status,
      createdAt: member.createdAt,
      sharedTeams,
    }
  }

  /** 친구 요청 보내기 */
  async sendMemberRequest(requesterId: string, recipientEmail: string) {
    const recipient = await this.usersService.findUserByEmail(recipientEmail);
    if (!recipient) throw new NotFoundException('존재하지 않는 유저입니다.');

    if (requesterId === recipient.id) {
      throw new BadRequestException('자기 자신에게는 요청할 수 없습니다.');
    }

    const exists = await this.memberRepository.findOne({
      where: [
        { requester: { id: requesterId }, recipient: { id: recipient.id } },
        { requester: { id: recipient.id }, recipient: { id: requesterId } },
      ],
    });

    if (exists) {
      if (exists.status === 'BLOCKED') throw new BadRequestException('차단된 사용자입니다.');
      if (exists.status === 'ACCEPTED') throw new BadRequestException('이미 친구입니다.');
      if (exists.status === 'PENDING') throw new BadRequestException('이미 요청이 존재합니다.');
    }

    const member = this.memberRepository.create({
      requester: { id: requesterId },
      recipient,
      status: MemberStatus.PENDING,
    });

    const saved = await this.memberRepository.save(member);
    const requester = await this.usersService.findUserById(requesterId);

    await this.notificationService.create({
      user: recipient,
      type: NotificationType.FRIEND_REQUEST,
      payload: {
        memberId: saved.id,
        requesterId,
        requesterName: requester?.displayName ?? requester?.name ?? "User",
      },
    });

    return saved;
  }

  /** 친구 요청 수락 */
  async acceptMemberRequest(memberId: string, userId: string) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    
    if (!member) {
      throw new NotFoundException('친구 요청이 존재하지 않습니다.');
    }

    if (member.recipient.id !== userId) {
      throw new BadRequestException('본인에게 온 요청만 수락할 수 있습니다.');
    }

    if (member.status !== 'PENDING') {
      throw new BadRequestException('이미 처리된 요청입니다.')
    }

    member.status = MemberStatus.ACCEPTED;
    const saved = await this.memberRepository.save(member);
    await this.notificationService.markFriendRequestHandled(memberId, userId);
    return saved;
  }

  /** 친구 요청 거절 또는 삭제 */
  async removeMember(memberId: string, userId: string) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('친구 관계가 존재하지 않습니다.');

    if (member.requester.id !== userId && member.recipient.id !== userId) {
      throw new BadRequestException('본인과 관련된 친구만 삭제할 수 있습니다.');
    }

    const removed = await this.memberRepository.remove(member);
    await this.notificationService.markFriendRequestHandled(memberId, userId);
    return removed;
  }

  /** 친구 요청 취소 */
  async cancelMemberRequest(memberId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('친구 요청이 존재하지 않습니다.');
    }

    if (member.requester.id !== userId) {
      throw new BadRequestException('본인이 보낸 요청만 취소할 수 있습니다.');
    }

    if (member.status !== 'PENDING') {
      throw new BadRequestException('이미 처리된 요청입니다.');
    }

    await this.memberRepository.remove(member);
    await this.notificationService.markFriendRequestHandled(memberId, member.recipient.id);
    return { success: true };
  }

  /** 친구 차단 */
  async blockMember(memberId: string, userId: string) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('친구 관계가 존재하지 않습니다.');

    if (member.requester.id !== userId && member.recipient.id !== userId) {
      throw new BadRequestException('본인과 관련된 친구만 차단할 수 있습니다.');
    }

    member.status = MemberStatus.BLOCKED;
    return this.memberRepository.save(member);
  }

  /** 친구 목록 조회 */
  async getMembers(userId: string, workspaceId?: string) {
    const members = await this.memberRepository.find({
      where: [
        { requester: { id: userId }, status: MemberStatus.ACCEPTED },
        { recipient: { id: userId }, status: MemberStatus.ACCEPTED },
      ],
    });

    const sharedTeamsMap = await this.resolveSharedTeams(members, userId, workspaceId);
    return members.map((member) =>
      this.normalizeMember(member, userId, sharedTeamsMap.get(this.getOtherUserId(member, userId)) ?? [])
    );
  }

  /** 친구 요청 목록 조회 (받은 요청) */
  async getPendingRequests(userId: string, workspaceId?: string) {
    const members = await this.memberRepository.find({
      where: { recipient: { id: userId }, status: MemberStatus.PENDING },
    });

    const sharedTeamsMap = await this.resolveSharedTeams(members, userId, workspaceId);
    return members.map((member) =>
      this.normalizeMember(member, userId, sharedTeamsMap.get(this.getOtherUserId(member, userId)) ?? [])
    );
  }

  /** 친구 요청 목록 조회 (보낸 요청) */
  async getSentRequests(userId: string, workspaceId?: string) {
    const members = await this.memberRepository.find({
      where: { requester: { id: userId }, status: MemberStatus.PENDING },
    });

    const sharedTeamsMap = await this.resolveSharedTeams(members, userId, workspaceId);
    return members.map((member) =>
      this.normalizeMember(member, userId, sharedTeamsMap.get(this.getOtherUserId(member, userId)) ?? [])
    );
  }

  /** 친구 검색 (이메일/이름) */
  async searchMembers(userId: string, keyword: string, workspaceId?: string) {
    const members = await this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.requester', 'requester')
      .leftJoinAndSelect('member.recipient', 'recipient')
      .where(
        '(requester.id = :userId OR recipient.id = :userId) AND status = :status',
        { userId, status: 'accepted' },
      )
      .andWhere(
        `(
          requester.name ILIKE :keyword OR requester.displayName ILIKE :keyword OR requester.email ILIKE :keyword
          OR recipient.name ILIKE :keyword OR recipient.displayName ILIKE :keyword OR recipient.email ILIKE :keyword
        )`,
        { keyword: `%${keyword}%` },
      )
      .getMany();

    const sharedTeamsMap = await this.resolveSharedTeams(members, userId, workspaceId);
    return members.map((member) =>
      this.normalizeMember(member, userId, sharedTeamsMap.get(this.getOtherUserId(member, userId)) ?? [])
    );
  }

  /** 친구 여부 */
  async isFriend(userId: string, targetId: string): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: [
        {
          requester: { id: userId },
          recipient: { id: targetId },
          status: MemberStatus.ACCEPTED,
        },
        {
          requester: { id: targetId },
          recipient: { id: userId },
          status: MemberStatus.ACCEPTED,
        },
      ],
    });

    return !!member;
  }

  private getOtherUserId(member: Member, myUserId: string) {
    return member.requester.id === myUserId ? member.recipient.id : member.requester.id;
  }

  private async resolveSharedTeams(
    members: Member[],
    userId: string,
    workspaceId?: string,
  ): Promise<Map<string, Array<{ id: string; name: string }>>> {
    const map = new Map<string, Array<{ id: string; name: string }>>();
    if (!workspaceId || members.length === 0) return map;

    const userIds = members.map((member) => this.getOtherUserId(member, userId));
    const rows = await this.teamMemberRepository
      .createQueryBuilder('tm')
      .innerJoin('tm.team', 'team')
      .innerJoin('tm.user', 'user')
      .where('team.workspaceId = :workspaceId', { workspaceId })
      .andWhere('user.id IN (:...userIds)', { userIds: Array.from(new Set(userIds)) })
      .select('user.id', 'userId')
      .addSelect('team.id', 'teamId')
      .addSelect('team.name', 'teamName')
      .getRawMany<{ userId: string; teamId: string; teamName: string }>();

    rows.forEach((row) => {
      const existing = map.get(row.userId) ?? [];
      existing.push({ id: row.teamId, name: row.teamName });
      map.set(row.userId, existing);
    });

    return map;
  }
}
