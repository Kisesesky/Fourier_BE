// src/modules/member/member.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { UsersService } from '../users/users.service';
import { MemberStatus } from './constants/member-status.enum';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private usersService: UsersService,
  ) {}

  private normalizeMember(member: Member, myUserId: string) {
    const isRequester = member.requester.id === myUserId;
    const otherUser = isRequester ? member.recipient : member.requester;

    return {
      memberId: member.id,
      userId: otherUser.id,
      displayName: otherUser.displayName ?? otherUser.name,
      avatarUrl: otherUser.avatarUrl,
      status: member.status,
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

    return this.memberRepository.save(member);
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
    return this.memberRepository.save(member);
  }

  /** 친구 요청 거절 또는 삭제 */
  async removeMember(memberId: string, userId: string) {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('친구 관계가 존재하지 않습니다.');

    if (member.requester.id !== userId && member.recipient.id !== userId) {
      throw new BadRequestException('본인과 관련된 친구만 삭제할 수 있습니다.');
    }

    return this.memberRepository.remove(member);
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
  async getMembers(userId: string) {
    const members = await this.memberRepository.find({
      where: [
        { requester: { id: userId }, status: MemberStatus.ACCEPTED },
        { recipient: { id: userId }, status: MemberStatus.ACCEPTED },
      ],
    });

    return members.map(member => this.normalizeMember(member, userId));
  }

  /** 친구 요청 목록 조회 (받은 요청) */
  async getPendingRequests(userId: string) {
    const members = await this.memberRepository.find({
      where: { recipient: { id: userId }, status: MemberStatus.PENDING },
    });

    return members.map(member => ({
      memberId: member.id,
      userId: member.requester.id,
      displayName: member.requester.displayName ?? member.requester.name,
      avatarUrl: member.requester.avatarUrl,
      status: member.status,
    }))
  }

  /** 친구 검색 (이메일/이름) */
  async searchMembers(userId: string, keyword: string) {
    return this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.requester', 'requester')
      .leftJoinAndSelect('member.recipient', 'recipient')
      .where(
        '(requester.id = :userId OR recipient.id = :userId) AND status = :status',
        { userId, status: 'accepted' },
      )
      .andWhere('(requester.name ILIKE :keyword OR recipient.name ILIKE :keyword)', { keyword: `%${keyword}%` })
      .getMany();
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
}