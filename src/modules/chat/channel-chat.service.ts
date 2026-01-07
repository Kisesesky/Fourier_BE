// src/modules/chat/channel-chat.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Channel } from '../channel/entities/channel.entity';
import { ChannelMessage } from './entities/channel-message.entity';
import { ChannelMember } from '../channel/entities/channel-member.entity';

@Injectable()
export class ChannelChatService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMessage)
    private readonly channelMessageRepository: Repository<ChannelMessage>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
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

  async sendMessage(channelId: string, userId: string, content: string) {
    await this.verifyChannelAccess(channelId, userId);

    const message = this.channelMessageRepository.create({
      channel: { id: channelId },
      sender: { id: userId },
      content,
    });

    return this.channelMessageRepository.save(message);
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.channelMessageRepository.findOne({
      where: { id: messageId },
      relations: ['channel', 'sender'],
    });

    if (!message) {
      throw new NotFoundException('메시지가 존재하지 않습니다.');
    }

    if (message.sender.id !== userId) {
      throw new ForbiddenException('본인이 보낸 메시지만 삭제할 수 있습니다.');
    }
    
    if (message.isDeleted) {
      return {
        type: 'soft-delete',
        messageId: message.id,
        channelId: message.channel.id,
        content: message.content,
      }
    }

    const readCount = await this.channelMemberRepository.count({
      where: {
        channel: { id: message.channel.id },
        lastReadAt: MoreThanOrEqual(message.createdAt),
      },
    });

    if (readCount === 0) {
      await this.channelMessageRepository.delete(message.id);
      return {
        type: 'hard-delete',
        messageId: message.id,
        channelId: message.channel.id,
      };
    }

    message.isDeleted = true;
    message.content = '삭제된 메시지입니다.';
    await this.channelMessageRepository.save(message);

    return {
      type: 'soft-delete',
      messageId: message.id,
      channelId: message.channel.id,
      content: message.content
    };
  }

  async getChannelMessages(channelId: string, userId: string, limit = 20, cursor?: string) {
    await this.verifyChannelAccess(channelId, userId);

    const qb = this.channelMessageRepository
      .createQueryBuilder('message')
      .leftJoin('message.sender', 'sender')
      .leftJoin('message.channel', 'channel')
      .addSelect(['channel.id'])
      .where('message.channelId = :channelId', { channelId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (cursor) {
      qb.andWhere('message.createdAt < :cursor', { cursor });
    }

    const messages = await qb.getMany();

    return messages.map((msg) => ({
      id: msg.id,
      channelId: msg.channel.id,
      senderId: msg.sender.id,
      content: msg.isDeleted ? '삭제된 메시지입니다.' : msg.content,
      createdAt: msg.createdAt,
      isDeleted: msg.isDeleted,
    }));
  }

  async getMyChannelIds(userId: string): Promise<string[]> {
    const channels = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.workspace', 'workspace')
      .innerJoin('channel.members', 'cm')
      .where('cm.userId = :userId')
      .select(['channel.id'])
      .getMany();

    return channels.map((channel) => channel.id)
  }

  async getUnreadCount(channelId: string, userId: string) {
    const member = await this.channelMemberRepository.findOne({
      where: {
        channel: { id: channelId },
        user: { id: userId },
      },
    });

    const lastReadAt = member?.lastReadAt ?? new Date(0);

    return this.channelMessageRepository.count({
      where: {
        channel: { id: channelId },
        createdAt: MoreThan(lastReadAt),
        sender: { id: Not(userId) },
        isDeleted: false,
      },
    });
  }

  async markChannelAsRead(channelId: string, userId: string, lastReadAt: Date) {
    await this.channelMemberRepository.update(
      {
        channel: { id: channelId },
        user: { id: userId },
        lastReadAt: LessThan(lastReadAt),
      },
      {
        lastReadAt,
      },
    );
  }

  async getChannelMeta(channelId: string, userId: string) {
    await this.verifyChannelAccess(channelId, userId);

    const lastMessage = await this.channelMessageRepository.findOne({
      where: { channel: { id: channelId } },
      order: { createdAt: 'DESC' },
    });

    const unreadCount = await this.getUnreadCount(channelId, userId);

    return {
      channelId,
      lastMessage: lastMessage?.content ?? null,
      lastMessageAt: lastMessage?.createdAt ?? null,
      unreadCount,
    };
  }

  async isMuted(channelId: string, userId: string) {
    const member = await this.channelMemberRepository.findOne({
      where: {
        channel: { id: channelId },
        user: { id: userId },
      },
    });

    if (!member) return false;
    if (member.isMuted) return true;
    if (member.mutedUntil && member.mutedUntil > new Date()) return true;

    return false;
  }

}