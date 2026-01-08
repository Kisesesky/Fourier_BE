// src/modules/chat/chat.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MembersService } from '../members/members.service';
import { ChatRoom } from './entities/chat-room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoomResponseDto } from './dto/chat-room-response.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    private readonly membersService: MembersService,
  ) {}

  async getOrCreateRoom(meId: string, targetId: string) {
    if (meId === targetId) {
      throw new BadRequestException('자기 자신과 DM은 불가능합니다.');
    }
    const isFriend = await this.membersService.isFriend(meId, targetId);
    if (!isFriend) {
      throw new ForbiddenException('친구만 DM 가능합니다.');
    }

    const [a, b] = [meId, targetId].sort();

    let room = await this.chatRoomRepository.findOne({
      where: {
        userA: { id: a },
        userB: { id: b },
      },
    });

    if (!room) {
      room = this.chatRoomRepository.create({
        userA: { id: a },
        userB: { id: b },
      });
      room = await this.chatRoomRepository.save(room);
    }

    return room;
  }

  async sendMessage(roomId: string, senderId: string, content: string) {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['userA', 'userB'],
    });

    if (!room) {
      throw new NotFoundException('채팅방이 존재하지 않습니다.');
    }

    if (![room.userA.id, room.userB.id].includes(senderId)) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    const message = this.chatMessageRepository.create({
      room,
      sender: {id: senderId},
      content,
    });

    return await Promise.all([
      this.chatMessageRepository.save(message),
      this.chatRoomRepository.update(room.id, { lastMessageAt: new Date() }),
    ]);
  }

  async getMyRooms(userId: string) {
    return this.chatRoomRepository.find({
      where: [
        { userA: { id: userId } },
        { userB: { id: userId } },
      ],
      relations: ['userA', 'userB'],
    })
  }
  
  async getMessages (
    roomId: string,
    userId: string,
    limit = 20,
    cursor?: string,
  ) {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['userA', 'userB'],
    });

    if (!room) {
      throw new NotFoundException('채팅방이 존재하지 않습니다.')
    }

    if (![room.userA.id, room.userB.id].includes(userId)) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    const qb = this.chatMessageRepository
      .createQueryBuilder('message')
      .where('message.roomId = :roomId', { roomId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (cursor) {
      qb.andWhere('message.createdAt < :cursor', { cursor });
    }

    await this.markRoomAsRead(roomId, userId);

    return qb.getMany().then((messages) => 
      messages.map((msg) => {
        if (msg.isDeleted) {
          return {
            id: msg.id,
            content: '삭제된 메시지입니다.',
            senderId: msg.sender.id,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            isDeleted: true,
          };
        }
        return msg;
      }),
    );
  }

  async getMyChats(userId: string) {
    const rooms = await this.chatRoomRepository.find({
      where: [
        { userA: { id: userId } },
        { userB: { id: userId } },
      ],
      relations: ['userA', 'userB'],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });

    return Promise.all(
      rooms.map(async (room): Promise<ChatRoomResponseDto> => {
        const target =
          room.userA.id === userId ? room.userB : room.userA;

        const lastMessage = await this.chatMessageRepository.findOne({
          where: { room: { id: room.id } },
          order: { createdAt: 'DESC' },
        });

        const unreadCount = await this.chatMessageRepository.count({
          where: {
            room: { id: room.id },
            isRead: false,
            sender: { id: Not(userId) },
          },
        });

        return {
          roomId: room.id,
          targetUser: target,
          lastMessage: lastMessage?.content ?? null,
          lastMessageAt: room.lastMessageAt,
          unreadCount,
        };
      }),
    );
  }

  async markRoomAsRead(roomId: string, userId: string) {
    await this.chatMessageRepository.update(
      {
        room: { id: roomId },
        isRead: false,
        sender: { id: Not(userId) },
      },
      { isRead: true },
    );
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['room', 'sender'],
    });

    if (!message) {
      throw new NotFoundException('메시지가 존재하지 않습니다.');
    }

    if (message.sender.id !== userId) {
      throw new ForbiddenException('본인이 보낸 메시지만 삭제할 수 있습니다.!')
    }

    if (!message.isRead) {
      await this.chatMessageRepository.delete(messageId);
      return {
        type: 'hard-delete',
        messageId,
        roomId: message.room.id,
      };
    }

    message.content = '삭제된 메시지입니다.';
    message.isDeleted = true;
    message.deletedAt = new Date();

    await this.chatMessageRepository.save(message);

    return {
      type: 'soft-delete',
      messageId,
      roomId: message.room.id,
      content: message.content,
    };
  }
}
