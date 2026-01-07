import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ChannelMember, ChannelMemberRole } from './entities/channel-member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChannelDto } from './dto/create-channel.dto';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';
import { Channel } from './entities/channel.entity';

@Injectable()
export class ChannelService {

  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async verifyChannelAccess(channelId: string, userId: string) {
    const exists = await this.channelMemberRepository.exists({
      where: {
        channel: { id: channelId },
        user: { id: userId },
      },
    });

    if (!exists) {
      throw new ForbiddenException('채널 멤버가 아닙니다.');
    }
  }

  async createChannel(workspaceId: string, creatorId: string ,createChannelDto: CreateChannelDto) {
    /** 1. 채널 생성 */
    const channel = await this.channelRepository.save({
      name: createChannelDto.name,
      isPrivate: createChannelDto.isPrivate,
      workspace: { id: workspaceId },
    });

    /** 2. ChannelMember 생성 */
    if (createChannelDto.isPrivate) {
      if (!createChannelDto.memberIds?.length) {
        throw new BadRequestException('private 채널은 멤버가 필요합니다.');
      }

      const members = createChannelDto.memberIds.map((id) => ({
        channel,
        user: { id },
        role: ChannelMemberRole.MEMBER,
      }));

      members.push({
        channel,
        user: { id: creatorId },
        role: ChannelMemberRole.OWNER,
      });

      await this.channelMemberRepository.save(members);
    }

    return channel;
  }


  async getChannelsByWorkspace(workspaceId: string, userId: string) {
    return this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.workspace', 'workspace')
      .innerJoin('channel.members', 'member')
      .where('workspace.id = :workspaceId', { workspaceId })
      .andWhere('member.userId = :userId', { userId })
      .orderBy('channel.createdAt', 'ASC')
      .getMany();
  }

  async muteChannel(channelId: string, userId: string) {
    await this.verifyChannelAccess(channelId, userId);

    await this.channelMemberRepository.update(
      { channel: { id: channelId }, user: { id: userId } },
      { isMuted: true }
    );
  }
}
