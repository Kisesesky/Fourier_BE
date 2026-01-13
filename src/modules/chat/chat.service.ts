// src/modules/chat/chat.service.ts
import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelMessage } from './entities/channel-message.entity';
import { DmRoom } from './entities/dm-room.entity';
import { DmMessage } from './entities/dm-message.entity';
import { User } from '../users/entities/user.entity';
import { AppConfigService } from 'src/config/app/config.service';
import * as jwt from 'jsonwebtoken';
import { MessageType } from './constants/message-type.enum';
import { isLongText } from './utils/long-text.util';
import { makePreview } from './utils/preview.util';
import { SendChannelMessageDto } from './dto/send-channel-message.dto';
import { SendDmMessageDto } from './dto/send-dm-message.dto';
import { MessageFile } from './entities/message-file.entity';
import { FilesService } from '../files/files.service';
import { MessageResponseDto } from './dto/message-response.dto';
import { mapMessageToResponse } from './utils/message.mapper';
import { MessageReaction } from './entities/message-reaction.entity';
import { ThreadRead } from './entities/thread-read.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMessage)
    private readonly channelMessageRepository: Repository<ChannelMessage>,
    @InjectRepository(DmRoom)
    private readonly dmRoomRepository: Repository<DmRoom>,
    @InjectRepository(DmMessage)
    private readonly dmMessageRepository: Repository<DmMessage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly appConfigService: AppConfigService,
    @InjectRepository(MessageFile)
    private readonly messageFileRepository: Repository<MessageFile>,
    private readonly filesService: FilesService,
    @InjectRepository(MessageReaction)
    private readonly messageReactionRepository: Repository<MessageReaction>,
    @InjectRepository(ThreadRead)
    private readonly threadReadRepository: Repository<ThreadRead>,
  ) {}

  /** JWT 토큰 검증 후 User 반환 */
  async verifyToken(token: string): Promise<User> {
    try {
      const payload: any = jwt.verify(token, this.appConfigService.jwtSecret);
      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('유저 없음');
      }
      return user;
    } catch (err) {
      throw new UnauthorizedException('유효하지 않은 토큰');
    }
  }

  /** Socket에서 연결된 유저 가져오기 */
  async getUserBySocket(socket: any): Promise<User> {
    const token = socket.handshake.auth?.token;
    if (!token) {
      throw new UnauthorizedException('토큰 없음');
    }
    return this.verifyToken(token);
  }
  
  /** 유저가 참여 중인 DM room ID 배열 반환 */
  async getUserDmRoomIds(userId: string): Promise<string[]> {
    const rooms = await this.dmRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'participants')
      .where('participants.id = :userId', { userId })
      .select('room.id')
      .getMany();

    return rooms.map(room => room.id);
  }

  /** 유저가 참여 중인 프로젝트 채널 ID 배열 반환 */
  async getUserChannelIds(userId: string): Promise<string[]> {
    // 채널 참여자는 프로젝트 멤버여야 함
    // 여기서는 단순히 유저가 속한 프로젝트의 채널 반환
    const channels = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.project', 'project')
      .innerJoin('project.members', 'member')
      .where('member.userId = :userId', { userId })
      .select('channel.id')
      .getMany();

    return channels.map(channel => channel.id);
  }

  async findMessageById(
    messageId: string,
  ): Promise<ChannelMessage | DmMessage> {
    const channelMessage = await this.channelMessageRepository.findOne({
      where: { id: messageId },
      relations: ['channel'],
    });

    if (channelMessage) return channelMessage;

    const dmMessage = await this.dmMessageRepository.findOne({
      where: { id: messageId },
      relations: ['room'],
    });

    if (dmMessage) return dmMessage;

    throw new NotFoundException('메시지를 찾을 수 없습니다.');
  }

  /** 채널 메시지 전송 */
  async sendChannelMessage(
    user: User,
    sendChannelMessageDto: SendChannelMessageDto
  ) {
    const channel = await this.channelRepository.findOne({ where: { id: sendChannelMessageDto.channelId } });
    if (!channel) {
      throw new NotFoundException('채널 없음');
    }

    let parentMessage: ChannelMessage | undefined;

    if (sendChannelMessageDto.parentMessageId) {
      parentMessage = await this.channelMessageRepository.findOneByOrFail({
        id: sendChannelMessageDto.parentMessageId,
      });
    }

    let fileIds = sendChannelMessageDto.fileIds ?? [];
    const hasContent = !!sendChannelMessageDto.content?.trim();

    if (!hasContent && fileIds.length === 0) {
      throw new BadRequestException('내용 또는 파일이 필요합니다.');
    }

    if (!fileIds.length && hasContent && isLongText(sendChannelMessageDto.content)) {
      const textFile = await this.filesService.createTextFile(
        sendChannelMessageDto.content!,
        user,
      );

      fileIds = [textFile.id];
    }

    const hasFiles = fileIds.length > 0;
    const type = hasFiles ? MessageType.FILE : MessageType.TEXT;

    // 1. 메시지 생성
    const message = await this.channelMessageRepository.save({
      channel,
      sender: user,
      type,
      content: hasFiles ? null : sendChannelMessageDto.content,
      preview: makePreview(sendChannelMessageDto.content),
      parentMessage,
    });

    // 2. 메시지 ↔ 파일 연결
    if (hasFiles) {
      await this.messageFileRepository.save(
        fileIds.map(fileId => ({
          channelMessage: message,
          file: { id: fileId },
        })),
      );
    }

    // 3. 답장수 증가
    if (parentMessage) {
      parentMessage.replyCount += 1;
      await this.channelMessageRepository.save(parentMessage);
    }

    return message;
  }

  /** 채널 메시지 조회 */
  async getChannelMessages(
    channelId: string,
    user: User,
    limit = 50,
    cursor?: string
  ): Promise<MessageResponseDto[]> {
    const qb = this.channelMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.files', 'messagefile')
      .leftJoinAndSelect('messagefile.file', 'file')
      .where('message.channelId = :channelId', { channelId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (cursor) {
      qb.andWhere('message.createdAt < :cursor', { cursor });
    }
    const messages = await qb.getMany();
    return messages.map(message => mapMessageToResponse(message, user.id));
  }

  /** 채널 메시지 읽음 처리 */
  async markChannelMessageRead(messageId: string, user: User) {
    const message = await this.channelMessageRepository.findOne({
      where: { id: messageId },
      relations: ['readBy', 'channel'],
    });
    if (!message) {
      throw new NotFoundException('메시지 없음');
    }

    if (!message.readBy.some(users => users.id === user.id)) {
      message.readBy.push(user);
      await this.channelMessageRepository.save(message);
    }
    return message;
  }

  /** DM 룸 조회/생성 */
  async getOrCreateDmRoom(userIds: string[], currentUser: User) {
    const sortedIds = [...userIds, currentUser.id].sort();

    const rooms = await this.dmRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.participants', 'user')
      .getMany();

    const existing = rooms.find(r => {
      const ids = r.participants.map(p => p.id).sort();
      return ids.join(',') === sortedIds.join(',');
    });

    if (existing) return existing;

    const newRoom = this.dmRoomRepository.create({
      participants: sortedIds.map(id => ({ id })),
    });
    return this.dmRoomRepository.save(newRoom);
  }

  /** DM 메시지 전송 */
  async sendDM(user: User, sendDmMessageDto: SendDmMessageDto) {
    const room = await this.dmRoomRepository.findOne({
      where: { id: sendDmMessageDto.roomId },
      relations: ['participants'],
    });
    if (!room || !room.participants.some(participants => participants.id === user.id)) {
      throw new ForbiddenException('참여자가 아님');
    }

    let fileIds = sendDmMessageDto.fileIds ?? [];
    const hasContent = !!sendDmMessageDto.content?.trim();

    if (!hasContent && fileIds.length === 0) {
      throw new BadRequestException('내용 또는 파일이 필요합니다');
    }

    if (!fileIds.length && hasContent && isLongText(sendDmMessageDto.content)) {
      const textFile = await this.filesService.createTextFile(
        sendDmMessageDto.content!,
        user,
      );
      fileIds = [textFile.id];
    }

    const hasFiles = fileIds.length > 0;
    const type = hasFiles ? MessageType.FILE : MessageType.TEXT;

    // 1. 메시지 생성
    const message = await this.dmMessageRepository.save({
      room,
      sender: user,
      type,
      content: hasFiles ? null : sendDmMessageDto.content,
      preview: makePreview(sendDmMessageDto.content),
    });

    // 2. 메시지 ↔ 파일 연결
    if (hasFiles) {
      await this.messageFileRepository.save(
        fileIds.map(fileId => ({
          dmMessage: message,
          file: { id: fileId },
        })),
      );
    }

    return message;
  }

  /** DM 메시지 조회 */
  async getDmMessages(
    roomId: string,
    user: User,
    limit = 50,
    cursor?: string
  ): Promise<MessageResponseDto[]> {
    const room = await this.dmRoomRepository.findOne({
      where: { id: roomId },
      relations: ['participants', 'messages', 'messages.sender'],
    });
    if (!room) {
      throw new NotFoundException('DM 방 없음');
    }

    const qb = this.dmMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.files', 'messagefile')
      .leftJoinAndSelect('messagefile.file', 'file')
      .where('message.roomId = :roomId', { roomId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (cursor) {
      qb.andWhere('message.createdAt < :cursor', { cursor });
    }

    const messages = await qb.getMany();
    return messages.map(message => mapMessageToResponse(message, user.id));
  }

  /** DM 메시지 읽음 처리 */
  async markDMMessageRead(messageId: string, user: User) {
    const message = await this.dmMessageRepository.findOne({
      where: { id: messageId },
      relations: ['readBy', 'room'],
    });
    if (!message) {
      throw new NotFoundException('메시지 없음');
    }

    if (!message.readBy.some(users => users.id === user.id)) {
      message.readBy.push(user);
      await this.dmMessageRepository.save(message);
    }

    return message;
  }

  /** 메세지 수정 */
  async editMessage(
    user: User,
    messageId: string,
    content: string,
  ) {
    const message =
      (await this.channelMessageRepository.findOne({ where: { id: messageId }, relations: ['sender'] })) ??
      (await this.dmMessageRepository.findOne({ where: { id: messageId }, relations: ['sender'] }));

    if (!message) {
      throw new NotFoundException('해당 메시지가 존재하지 않습니다.');
    }
    if (message.sender.id !== user.id) {
      throw new ForbiddenException('본인이 작성한 메시지만 수정이 가능합니다.');
    }

    message.content = content;
    message.editedAt = new Date();
    message.preview = makePreview(content);

    return message instanceof ChannelMessage
      ? this.channelMessageRepository.save(message)
      : this.dmMessageRepository.save(message);
  }

  /** 메세지 삭제 */
  async deleteMessage(user: User, messageId: string) {
    const message =
      (await this.channelMessageRepository.findOne({ where: { id: messageId }, relations: ['sender'] })) ??
      (await this.dmMessageRepository.findOne({ where: { id: messageId }, relations: ['sender'] }));

    if (!message) {
      throw new NotFoundException('해당 메시지가 존재하지 않습니다.');
    }
    if (message.sender.id !== user.id) {
      throw new ForbiddenException('본인이 작성한 메시지만 삭제가 가능합니다.');
    }

    message.isDeleted = true;
    message.content = null;
    message.files = [];

    return message instanceof ChannelMessage
      ? this.channelMessageRepository.save(message)
      : this.dmMessageRepository.save(message);
  }

  async getThreadMessages(
    parentMessageId: string,
    user: User
  ) {
    const replies = await this.channelMessageRepository.find({
      where: { parentMessage: { id: parentMessageId } },
      relations: ['sender', 'files', 'files.file'],
      order: { createdAt: 'ASC' },
    });

    return replies.map(message => mapMessageToResponse(message, user.id));
  }

  async toggleReaction(
    user: User,
    messageId: string,
    emoji: string,
  ) {
    const message =
      (await this.channelMessageRepository.findOne({ where: { id: messageId } })) ??
      (await this.dmMessageRepository.findOne({ where: { id: messageId } }));
    
    if (!message) {
      throw new NotFoundException('메시지가 없습니다.');
    }

    const existing = await this.messageReactionRepository.findOne({
      where: {
        user: { id: user.id },
        emoji,
        ...(message instanceof ChannelMessage)
          ? { channelMessage: { id: message.id } }
          : { dmMessage: { id: message.id } },
      },
    });

    if (existing) {
      await this.messageReactionRepository.remove(existing);
      return { action: 'removed' };
    }

    await this.messageReactionRepository.save({
      user,
      emoji,
      ...(message instanceof ChannelMessage)
          ? { channelMessage: message }
          : { dmMessage: message },
    });

    return { action: 'added' };
  }

  async sendThreadMessage(
    user: User,
    parentMessageId: string,
    content?: string,
    fileIds: string[] = [],
  ) {
    const parent =
      (await this.channelMessageRepository.findOne({ where: { id: parentMessageId } })) ??
      (await this.dmMessageRepository.findOne({ where: { id: parentMessageId } }));
    
    if (!parent) {
      throw new NotFoundException('스레드 메시지가 없습니다.');
    }

    let reply: ChannelMessage | DmMessage;
    
    if (parent instanceof ChannelMessage) {
      reply = await this.channelMessageRepository.save({
        sender: user,
        parentMessage: parent,
        type: fileIds.length ? MessageType.FILE : MessageType.TEXT,
        content,
      });

      parent.replyCount += 1;
      parent.lastReplyAt = new Date();
      await this.channelMessageRepository.save(parent);
    } else {
      reply = await this.dmMessageRepository.save({
        sender: user,
        parentMessage: parent,
        type: fileIds.length ? MessageType.FILE : MessageType.TEXT,
        content,
      });

      parent.replyCount += 1;
      parent.lastReplyAt = new Date();
      await this.dmMessageRepository.save(parent);
    }

    if (fileIds.length) {
      await this.messageFileRepository.save(
        fileIds.map((fileId) => ({
          file: { id: fileId },
          ...(parent instanceof ChannelMessage
            ? { channelMessage: reply }
            : { dmMessage: reply }),
        })),
      );
    }

    return reply;
  }

  async markThreadRead(
    user: User,
    parentMessageId: string,
  ) {
    const existing = await this.threadReadRepository.findOne({
      where: {
        user: { id: user.id },
        parentMessage: { id: parentMessageId },
      },
    });

    if (existing) {
      existing.lastReadAt = new Date();
      return this.threadReadRepository.save(existing);
    }

    return this.threadReadRepository.save({
      user,
      parentMessage: { id: parentMessageId },
      lastReadAt: new Date(),
    });
  }

  async getThreadUnreadCount(
    parentMessageId: string,
    userId: string,
  ): Promise<number> {
    const lastRead = await this.threadReadRepository.findOne({
      where: {
        user: { id: userId },
        parentMessage: { id: parentMessageId },
      },
    });

    const qb = this.channelMessageRepository
      .createQueryBuilder('message')
      .innerJoin('message.parentMessage', 'parent')
      .where('parent.id = :parentMessageId', { parentMessageId });

    if (lastRead) {
      qb.andWhere('message.createdAt > :lastReadAt', {
        lastReadAt: lastRead.lastReadAt,
      });
    }

    return qb.getCount();
  }
}