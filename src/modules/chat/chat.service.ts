// src/modules/chat/chat.service.ts
import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelMessage } from './entities/channel-message.entity';
import { DmRoom } from './entities/dm-room.entity';
import { DmMessage } from './entities/dm-message.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
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
import { ChannelRead } from './entities/channel-read.entity';
import { DmRead } from './entities/dm-read.entity';
import { ScopedMessage } from './types/message-scope.type';
import { MessageSearch } from './entities/message-search.entity';
import { SearchMessageDto } from './dto/search-message.dto';
import { GetMessageContextDto } from './dto/get-message-context.dto';
import { ChannelPinnedMessage } from './entities/channel-pinned-message.entity';
import { SavedMessage } from './entities/saved-message.entity';
import { extractFirstUrl } from './utils/extract-url-util';
import { LinkPreview } from './entities/link-preview.entity';
import { LinkPreviewService } from './services/link-preview.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChannelPreference } from './entities/channel-preference.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMessage)
    private readonly channelMessageRepository: Repository<ChannelMessage>,
    @InjectRepository(ChannelRead)
    private readonly channelReadRepository: Repository<ChannelRead>,
    @InjectRepository(ChannelPinnedMessage)
    private readonly channelPinnedRepository: Repository<ChannelPinnedMessage>,
    @InjectRepository(ChannelPreference)
    private readonly channelPreferenceRepository: Repository<ChannelPreference>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(DmRoom)
    private readonly dmRoomRepository: Repository<DmRoom>,
    @InjectRepository(DmMessage)
    private readonly dmMessageRepository: Repository<DmMessage>,
    @InjectRepository(DmRead)
    private readonly dmReadRepository: Repository<DmRead>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(MessageFile)
    private readonly messageFileRepository: Repository<MessageFile>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly filesService: FilesService,
    @InjectRepository(MessageReaction)
    private readonly messageReactionRepository: Repository<MessageReaction>,
    @InjectRepository(ThreadRead)
    private readonly threadReadRepository: Repository<ThreadRead>,
    @InjectRepository(MessageSearch)
    private readonly messageSearchRepository: Repository<MessageSearch>,
    @InjectRepository(SavedMessage)
    private readonly savedMessageRepository: Repository<SavedMessage>,
    @InjectRepository(LinkPreview)
    private readonly linkPreviewRepository: Repository<LinkPreview>,
    private readonly linkPreviewService: LinkPreviewService,
    private readonly eventEmitter: EventEmitter2,
    private readonly appConfigService: AppConfigService,
  ) {}

  private async indexChannelMessage(message: ChannelMessage) {
    if (!message.content) return;

    await this.messageSearchRepository.save({
      messageId: message.id,
      scope: 'CHANNEL',
      scopeId: message.channel.id,
      content: message.content,
      sender: message.sender,
    });
  }

  private async indexDmMessage(message: DmMessage) {
    if (!message.content) return;

    await this.messageSearchRepository.save({
      messageId: message.id,
      scope: 'DM',
      scopeId: message.room.id,
      content: message.content,
      sender: message.sender,
    });
  }

  private async updateSearchIndex(messageId: string, content: string) {
    await this.messageSearchRepository.update({ messageId }, { content });
  }

  private async getChannelMessageContext(
    channelMessage: ChannelMessage,
    user: User,
    limit = 20,
  ) {
    const half = Math.floor(limit / 2);

    const before = await this.channelMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.files', 'messagefile')
      .leftJoinAndSelect('messagefile.file', 'file')
      .leftJoinAndSelect('message.linkPreview', 'linkPreview')
      .where('message.channelId = :channelId', {
        channelId: channelMessage.channel.id,
      })
      .andWhere('message.createdAt < :createdAt', {
        createdAt: channelMessage.createdAt,
      })
      .orderBy('message.createdAt', 'DESC')
      .take(half)
      .getMany();

    const after = await this.channelMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.files', 'messagefile')
      .leftJoinAndSelect('messagefile.file', 'file')
      .leftJoinAndSelect('message.linkPreview', 'linkPreview')
      .where('message.channelId = :channelId', {
        channelId: channelMessage.channel.id,
      })
      .andWhere('message.createdAt > :createdAt', {
        createdAt: channelMessage.createdAt,
      })
      .orderBy('message.createdAt', 'ASC')
      .take(half)
      .getMany();

    return {
      anchor: mapMessageToResponse(channelMessage, user.id),
      before: before.reverse().map(message => mapMessageToResponse(message, user.id)),
      after: after.map(message => mapMessageToResponse(message, user.id)),
    };
  }

  private async getDmMessageContext(
    dmMessage: DmMessage,
    user: User,
    limit = 20,
  ) {
    const half = Math.floor(limit / 2);

    const before = await this.dmMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.files', 'messagefile')
      .leftJoinAndSelect('messagefile.file', 'file')
      .leftJoinAndSelect('message.linkPreview', 'linkPreview')
      .where('message.roomId = :roomId', { roomId: dmMessage.room.id })
      .andWhere('message.createdAt < :createdAt', { createdAt: dmMessage.createdAt })
      .orderBy('message.createdAt', 'DESC')
      .take(half)
      .getMany();

    const after = await this.dmMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.files', 'messagefile')
      .leftJoinAndSelect('messagefile.file', 'file')
      .leftJoinAndSelect('message.linkPreview', 'linkPreview')
      .where('message.roomId = :roomId', { roomId: dmMessage.room.id })
      .andWhere('message.createdAt > :createdAt', { createdAt: dmMessage.createdAt })
      .orderBy('message.createdAt', 'ASC')
      .take(half)
      .getMany();

    return {
      anchor: mapMessageToResponse(dmMessage, user.id),
      before: before.reverse().map(message => mapMessageToResponse(message, user.id)),
      after: after.map(message => mapMessageToResponse(message, user.id)),
    };
  }

  private async createLinkPreviewAsync({ scope, message, url }: {
    scope: 'CHANNEL' | 'DM';
    message: ChannelMessage | DmMessage;
    url: string;
  }) {
    setImmediate(async () => {
      const preview = await this.linkPreviewService.fetch(url);
      if (!preview) return;

      await this.linkPreviewRepository.save({
        ...preview,
        ...(scope === 'CHANNEL' ? { channelMessage: message } : { dmMessage: message }),
      });

      this.eventEmitter.emit('linkPreview.created', { scope, message, preview });
    });
  }

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

  /** 유저가 참여 중인 프로젝트 채널 ID 배열 반환 */
  async getUserChannelIds(userId: string): Promise<string[]> {
    const channels = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.project', 'project')
      .innerJoin('project.members', 'member')
      .where('member.userId = :userId', { userId })
      .select('channel.id')
      .getMany();

    return channels.map(channel => channel.id);
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

  async getProjectChannels(projectId: string, userId: string): Promise<Channel[]> {
    const channels = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.project', 'project')
      .innerJoin('project.members', 'member')
      .where('project.id = :projectId', { projectId })
      .andWhere('member.userId = :userId', { userId })
      .orderBy('channel.createdAt', 'ASC')
      .getMany();
    return channels;
  }

  async createChannel(
    projectId: string,
    user: User,
    name: string,
    memberIds: string[] = [],
  ) {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      throw new BadRequestException('채널 이름이 필요합니다.');
    }
    await this.assertProjectMember(projectId, user.id);
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }
    const channel = await this.channelRepository.save(
      this.channelRepository.create({
        name: trimmed,
        project,
        isDefault: false,
      }),
    );

    const uniqueIds = Array.from(new Set([user.id, ...(memberIds || [])]));
    const members = await this.projectMemberRepository.find({
      where: { project: { id: projectId }, user: { id: In(uniqueIds) } },
      relations: ['user'],
    });
    if (members.length > 0) {
      await this.channelMemberRepository.save(
        members.map((member) =>
          this.channelMemberRepository.create({
            channel,
            user: member.user,
          }),
        ),
      );
    }

    return {
      channel,
      memberIds: members.map((member) => member.user.id),
    };
  }

  private async assertProjectMember(projectId: string, userId: string) {
    const count = await this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project.members', 'member')
      .where('project.id = :projectId', { projectId })
      .andWhere('member.userId = :userId', { userId })
      .getCount();
    if (count === 0) {
      throw new ForbiddenException('프로젝트 접근 권한이 없습니다.');
    }
  }

  async getChannelPreferences(projectId: string, user: User) {
    await this.assertProjectMember(projectId, user.id);
    const pref = await this.channelPreferenceRepository.findOne({
      where: {
        project: { id: projectId },
        user: { id: user.id },
      },
    });
    return {
      pinnedChannelIds: pref?.pinnedChannelIds ?? [],
      archivedChannelIds: pref?.archivedChannelIds ?? [],
    };
  }

  async saveChannelPreferences(
    projectId: string,
    user: User,
    payload: { pinnedChannelIds: string[]; archivedChannelIds: string[] },
  ) {
    await this.assertProjectMember(projectId, user.id);
    const pinnedChannelIds = Array.from(new Set(payload.pinnedChannelIds ?? []));
    const archivedChannelIds = Array.from(new Set(payload.archivedChannelIds ?? []));
    const existing = await this.channelPreferenceRepository.findOne({
      where: { project: { id: projectId }, user: { id: user.id } },
    });
    if (existing) {
      existing.pinnedChannelIds = pinnedChannelIds;
      existing.archivedChannelIds = archivedChannelIds;
      await this.channelPreferenceRepository.save(existing);
      return existing;
    }
    const created = this.channelPreferenceRepository.create({
      project: { id: projectId } as Project,
      user: { id: user.id } as User,
      pinnedChannelIds,
      archivedChannelIds,
    });
    return this.channelPreferenceRepository.save(created);
  }

  async findScopedMessageById(
    messageId: string,
  ): Promise<ScopedMessage<ChannelMessage | DmMessage>> {

    const channelMessage = await this.channelMessageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'channel', 'threadParent', 'files', 'files.file', 'linkPreview', 'replyTo'],
    });

    if (channelMessage) {
      return { scope: 'CHANNEL', message: channelMessage };
    }

    const dmMessage = await this.dmMessageRepository.findOne({
      where: { id: messageId },
      relations: ['room', 'sender', 'files', 'files.file', 'linkPreview', 'replyTo'],
    });

    if (dmMessage) {
      return { scope: 'DM', message: dmMessage };
    }

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

    let replyTo: ChannelMessage | undefined;
    let threadParent: ChannelMessage | undefined;

    if (sendChannelMessageDto.replyToMessageId) {
      replyTo = await this.channelMessageRepository.findOne({
        where: { id: sendChannelMessageDto.replyToMessageId },
        relations: ['threadParent'],
      });

      if (!replyTo) {
        throw new NotFoundException('reply 대상 메시지 없음');
      }

      // 메인 타임라인에서는 thread 메시지에 reply 불가
      if (replyTo.threadParent && !sendChannelMessageDto.threadParentId) {
        throw new BadRequestException(
          '스레드 메시지에는 메인 채널에서 답장할 수 없습니다.',
        );
      }
    }

    if (sendChannelMessageDto.threadParentId) {
      threadParent = await this.channelMessageRepository.findOne({
        where: { id: sendChannelMessageDto.threadParentId },
        relations: ['threadParent'],
      });

      if (!threadParent) {
        throw new NotFoundException('thread parent 메시지 없음');
      }

      if (threadParent.threadParent) {
        throw new BadRequestException('중첩 스레드는 허용되지 않습니다.');
      }
    }

    if (replyTo && threadParent) {
      if (replyTo.threadParent?.id !== threadParent.id) {
        throw new BadRequestException('다른 스레드의 메시지에는 답장할 수 없습니다.');
      }
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

    // 1. 메시지 생성
    const message = await this.channelMessageRepository.save({
      channel,
      sender: user,
      senderId: user.id,
      senderName: user.displayName ?? user.name,
      senderAvatar: user.avatarUrl,
      type: fileIds.length ? MessageType.FILE : MessageType.TEXT,
      content: fileIds.length ? null : sendChannelMessageDto.content,
      preview: makePreview(sendChannelMessageDto.content),
      replyTo,
      threadParent,
    });

    // 2. 메시지 ↔ 파일 연결
    if (fileIds.length) {
      await this.messageFileRepository.save(
        fileIds.map(fileId => ({
          channelMessage: message,
          file: { id: fileId },
        })),
      );
    }

    const url = extractFirstUrl(sendChannelMessageDto.content);

    if (url) {
      this.createLinkPreviewAsync({ scope: 'CHANNEL', message, url });
    }

    await this.indexChannelMessage(message);
    return message;
  }

  async getMessageContext(
    user: User,
    getMessageContextDto: GetMessageContextDto,
  ) {
    const scoped = await this.findScopedMessageById(getMessageContextDto.messageId);
    const limit = getMessageContextDto.limit ?? 20;

    if (scoped.scope === 'CHANNEL') {
      return this.getChannelMessageContext(
        scoped.message as ChannelMessage,
        user,
        limit,
      );
    }

    return this.getDmMessageContext(
      scoped.message as DmMessage,
      user,
      limit,
    );
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
      .leftJoinAndSelect('message.threadParent', 'threadParent')
      .leftJoinAndSelect('message.files', 'messagefile')
      .leftJoinAndSelect('messagefile.file', 'file')
      .leftJoinAndSelect('message.reactions', 'reaction')
      .leftJoinAndSelect('reaction.user', 'reactionUser')
      .leftJoinAndSelect('message.linkPreview', 'linkPreview')
      .where('message.channelId = :channelId', { channelId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (cursor) {
      qb.andWhere('message.createdAt < :cursor', { cursor });
    }
    const messages = await qb.getMany();

    const parentIds = messages
      .filter(m => !m.threadParent && m.threadCount > 0)
      .map(m => m.id);

    const unreadMap = await this.getThreadUnreadCountMap(
      parentIds,
      user.id,
    );

    return messages.map(message =>
      mapMessageToResponse(message, user.id, {
        threadUnreadCount: unreadMap[message.id] ?? 0,
      }),
    );
  }

  /** DM 룸 조회/생성 */
  async getOrCreateDmRoom(userIds: string[], currentUser: User) {
    const sortedIds = [...userIds, currentUser.id].sort();

    const rooms = await this.dmRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.participants', 'participant')
      .getMany();

    const existing = rooms.find(room => {
      const ids = room.participants.map(participant => participant.id).sort();
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

    let replyTo: DmMessage | undefined;

    if (sendDmMessageDto.replyToMessageId) {
      replyTo = await this.dmMessageRepository.findOne({
        where: { id: sendDmMessageDto.replyToMessageId },
      });
      if (!replyTo) {
        throw new NotFoundException('reply 대상 메시지가 없습니다.');
      }
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

    // 1. 메시지 생성
    const message = await this.dmMessageRepository.save({
      room,
      sender: user,
      senderId: user.id,
      senderName: user.displayName ?? user.name,
      senderAvatar: user.avatarUrl,
      type: fileIds.length ? MessageType.FILE : MessageType.TEXT,
      content: fileIds.length ? null : sendDmMessageDto.content,
      preview: makePreview(sendDmMessageDto.content),
      replyTo,
    });

    // 2. 메시지 ↔ 파일 연결
    if (fileIds.length) {
      await this.messageFileRepository.save(
        fileIds.map(fileId => ({
          dmMessage: message,
          file: { id: fileId },
        })),
      );
    }

    const url = extractFirstUrl(sendDmMessageDto.content);

    if (url) {
      this.createLinkPreviewAsync({ scope: 'DM', message, url });
    }

    await this.indexDmMessage(message);
    return message;
  }

  /** DM 메시지 조회 */
  async getDmMessages(
    roomId: string,
    user: User,
    limit = 50,
    cursor?: string
  ) {
    const room = await this.dmRoomRepository.findOne({
      where: { id: roomId },
      relations: ['participants'],
    });
    if (!room || !room.participants.some(participant => participant.id === user.id)) {
      throw new NotFoundException('참여자가 아닙니다.');
    }

    const qb = this.dmMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.files', 'messagefile')
      .leftJoinAndSelect('messagefile.file', 'file')
      .leftJoinAndSelect('message.linkPreview', 'linkPreview')
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
  async markDmRead(
    roomId: string,
    user: User
  ) {
    const existing = await this.dmReadRepository.findOne({
      where: {
        user: { id: user.id },
        room: { id: roomId},
      },
    });

    if (existing) {
      existing.lastReadAt = new Date();
      return this.dmReadRepository.save(existing);
    }

    return this.dmReadRepository.save({
      user,
      room: { id: roomId },
      lastReadAt: new Date(),
    });
  }

  /** 메세지 수정 */
  async editMessage(
    user: User,
    messageId: string,
    content: string,
  ) {
    const scoped = await this.findScopedMessageById(messageId);
    const message = scoped.message;

    if (message.sender.id !== user.id) {
      throw new ForbiddenException('본인이 작성한 메시지만 수정이 가능합니다.');
    }

    message.content = content;
    message.editedAt = new Date();
    message.preview = makePreview(content);

    await this.updateSearchIndex(message.id, content);

    return scoped.scope === 'CHANNEL'
      ? this.channelMessageRepository.save(message as ChannelMessage)
      : this.dmMessageRepository.save(message as DmMessage);
  }

  /** 메세지 삭제 */
  async deleteMessage(
    user: User,
    messageId: string
  ) {
    const scoped = await this.findScopedMessageById(messageId);
    const message = scoped.message;

    if (message.sender.id !== user.id) {
      throw new ForbiddenException('본인이 작성한 메시지만 삭제가 가능합니다.');
    }

    message.isDeleted = true;
    message.content = null;
    message.files = [];

    await this.messageSearchRepository.delete({
      messageId: message.id,
    });

    return scoped.scope === 'CHANNEL'
      ? this.channelMessageRepository.save(message as ChannelMessage)
      : this.dmMessageRepository.save(message as DmMessage);
  }

  async getThreadMessages(
    threadParentId: string,
    user: User
  ) {
    const replies = await this.channelMessageRepository.find({
      where: { threadParent: { id: threadParentId } },
      relations: ['sender', 'threadParent', 'files', 'files.file', 'reactions', 'reactions.user'],
      order: { createdAt: 'ASC' },
    });

    const parent = await this.channelMessageRepository.findOne({
      where: { id: threadParentId },
      relations: ['channel', 'channel.project', 'channel.project.members'],
    });

    if (!parent) throw new NotFoundException();

    const isMember = parent.channel.project.members.some(
      m => m.user.id === user.id,
    );

    if (!isMember) {
      throw new ForbiddenException('채널 접근 권한 없음');
    }

    return replies.map(message => mapMessageToResponse(message, user.id));
  }

  async toggleReaction(
    user: User,
    messageId: string,
    emoji: string,
  ) {
    const scoped = await this.findScopedMessageById(messageId);
    const where =
      scoped.scope === 'CHANNEL'
        ? { channelMessage: { id: scoped.message.id } }
        : { dmMessage: { id: scoped.message.id } };

    const existing = await this.messageReactionRepository.findOne({
      where: {
        user: { id: user.id },
        emoji,
        ...where,
      },
    });

    if (existing) {
      await this.messageReactionRepository.remove(existing);
      return { action: 'removed' };
    }

    await this.messageReactionRepository.save({
      user,
      emoji,
      ...(scoped.scope === 'CHANNEL')
          ? { channelMessage: scoped.message }
          : { dmMessage: scoped.message },
    });

    return { action: 'added' };
  }

  async sendThreadMessage(
    user: User,
    threadParentId: string,
    content?: string,
    fileIds: string[] = [],
  ) {
    const parent = await this.channelMessageRepository.findOne({
      where: { id: threadParentId },
      relations: ['channel'],
    });
    
    if (!parent) {
      throw new NotFoundException('DM 메시지에는 스레드를 생성할 수 없습니다.');
    }
    if (parent.threadParent) {
      throw new BadRequestException('스레드 안에 스레드를 생성할 수 없습니다.');
    }
  
    const threadMessage = await this.channelMessageRepository.save({
      channel: parent.channel,
      sender: user,
      senderId: user.id,
      senderName: user.displayName ?? user.name,
      senderAvatar: user.avatarUrl,
      threadParent: parent,
      type: fileIds.length ? MessageType.FILE : MessageType.TEXT,
      content,
    });

    await this.channelMessageRepository.increment(
      { id: parent.id },
      'threadCount',
      1,
    );

    await this.channelMessageRepository.update(
      { id: parent.id },
      { lastThreadAt: new Date() },
    );

    if (fileIds.length) {
      await this.messageFileRepository.save(
        fileIds.map((fileId) => ({
          file: { id: fileId },
          channelMessage: threadMessage,
        })),
      );
    }

    return threadMessage;
  }

  async markThreadRead(
    user: User,
    threadParentId: string,
  ) {
    const existing = await this.threadReadRepository.findOne({
      where: {
        user: { id: user.id },
        threadParent: { id: threadParentId },
      },
    });

    if (existing) {
      existing.lastReadAt = new Date();
      return this.threadReadRepository.save(existing);
    }

    return this.threadReadRepository.save({
      user,
      threadParent: { id: threadParentId },
      lastReadAt: new Date(),
    });
  }

  async getThreadUnreadCount(
    threadParentId: string,
    userId: string,
  ): Promise<number> {
    const lastRead = await this.threadReadRepository.findOne({
      where: {
        user: { id: userId },
        threadParent: { id: threadParentId },
      },
    });

    const qb = this.channelMessageRepository
      .createQueryBuilder('message')
      .innerJoin('message.threadParent', 'parent')
      .where('parent.id = :threadParentId', { threadParentId });

    if (lastRead) {
      qb.andWhere('message.createdAt > :lastReadAt', {
        lastReadAt: lastRead.lastReadAt,
      });
    }

    return qb.getCount();
  }

  async markChannelRead(
    channelId: string,
    user: User,
  ) {
    const existing = await this.channelReadRepository.findOne({
      where: {
        user: { id: user.id },
        channel: { id: channelId },
      },
    });

    if (existing) {
      existing.lastReadAt = new Date();
      return this.channelReadRepository.save(existing);
    }

    return this.channelReadRepository.save({
      user,
      channel: { id: channelId },
      lastReadAt: new Date(),
    });
  }

  async getChannelUnreadCount(
    channelId: string,
    userId: string,
  ) {
    const read = await this.channelReadRepository.findOne({
      where: {
        user: { id: userId },
        channel: { id: channelId },
      },
    });

    const qb = this.channelMessageRepository
      .createQueryBuilder('message')
      .where('message.channelId = :channelId', { channelId });

    if (read) {
      qb.andWhere('message.createdAt > :lastReadAt', {
        lastReadAt: read.lastReadAt,
      });
    }

    return qb.getCount();
  }

  async getDmUnreadCount(
    roomId: string,
    userId: string,
  ) {
    const read = await this.dmReadRepository.findOne({
      where: {
        user: { id: userId },
        room: { id: roomId },
      },
    });

    const qb = this.dmMessageRepository
      .createQueryBuilder('message')
      .where('message.roomId = :roomId', { roomId });

    if (read) {
      qb.andWhere('message.createdAt > :lastReadAt', {
        lastReadAt: read.lastReadAt,
      });
    }

    return qb.getCount();
  }

  async getThreadUnreadCountMap(
    threadParentIds: string[],
    userId: string,
  ): Promise<Record<string, number>> {

    if (threadParentIds.length === 0) return {};

    const reads = await this.threadReadRepository.find({
      where: {
        user: { id: userId },
        threadParent: { id: In(threadParentIds) },
      },
    });

    const readMap = new Map(
      reads.map(r => [r.threadParent.id, r.lastReadAt]),
    );

    const qb = this.channelMessageRepository
      .createQueryBuilder('reply')
      .select('reply.threadParentId', 'parentId')
      .addSelect('COUNT(reply.id)', 'count')
      .where('reply.threadParentId IN (:...ids)', {
        ids: threadParentIds,
      })
      .groupBy('reply.threadParentId');

    const rows = await qb.getRawMany();

    const result: Record<string, number> = {};

    for (const row of rows) {
      const parentId = row.parentId;
      const lastReadAt = readMap.get(parentId);

      if (!lastReadAt) {
        result[parentId] = Number(row.count);
        continue;
      }

      const count = await this.channelMessageRepository
        .createQueryBuilder('reply')
        .where('reply.parentMessageId = :parentId', { parentId })
        .andWhere('reply.createdAt > :lastReadAt', { lastReadAt })
        .getCount();

      result[parentId] = count;
    }

    return result;
  }

  async searchMessages(
    user: User,
    searchMessageDto: SearchMessageDto,
  ) {
    const channelIds = await this.getUserChannelIds(user.id);
    const dmRoomIds = await this.getUserDmRoomIds(user.id);

    const qb = this.messageSearchRepository
      .createQueryBuilder('search')
      .leftJoinAndSelect('search.sender', 'sender')
      .where('search.content ILIKE :query', {
        query: `%${searchMessageDto.query}%`,
      })
      .andWhere(
        `(search.scope = 'CHANNEL' AND search.scopeId IN (:...channelIds))
        OR
        (search.scope = 'DM' AND search.scopeId IN (:...dmRoomIds))`,
        {
          channelIds: channelIds.length ? channelIds : ['__none__'],
          dmRoomIds: dmRoomIds.length ? dmRoomIds : ['__none__'],
        },
      )
      .orderBy('search.createdAt', 'DESC')
      .take(searchMessageDto.limit ?? 20);

    if (searchMessageDto.scope) {
      qb.andWhere('search.scope = :scope', { scope: searchMessageDto.scope });
    }

    if (searchMessageDto.scopeId) {
      qb.andWhere('search.scopeId = :scopeId', { scopeId: searchMessageDto.scopeId });
    }

    return qb.getMany();
  }

  async pinMessage(
    user: User,
    messageId: string,
  ) {
    const message = await this.channelMessageRepository.findOne({
      where: { id: messageId },
      relations: ['channel'],
    });

    if (!message) {
      throw new NotFoundException('메시지 없음');
    }

    const exists = await this.channelPinnedRepository.findOne({
      where: {
        channel: { id: message.channel.id },
        message: { id: message.id },
      },
    });

    if (exists) return exists;

    return this.channelPinnedRepository.save({
      channel: message.channel,
      message,
      pinnedBy: user,
    });
  }

  async unpinMessage(
    user: User,
    messageId: string,
  ) {
    const pinned = await this.channelPinnedRepository.findOne({
      where: {
        message: { id: messageId },
      },
      relations: ['channel'],
    });

    if (!pinned) {
      throw new NotFoundException('고정되지 않은 메시지');
    }

    await this.channelPinnedRepository.remove(pinned);
    return pinned;
  }

  async getPinnedMessages(channelId: string) {
    return this.channelPinnedRepository.find({
      where: {
        channel: { id: channelId },
      },
      relations: ['message', 'message.sender'],
      order: { pinnedAt: 'DESC' },
    });
  }

  async toggleSaveMessage(
    user: User,
    messageId: string,
  ) {
    const scoped = await this.findScopedMessageById(messageId);

    const where =
      scoped.scope === 'CHANNEL'
        ? { channelMessage: { id: scoped.message.id } }
        : { dmMessage: { id: scoped.message.id } };

    const existing = await this.savedMessageRepository.findOne({
      where: {
        user: { id: user.id },
        ...where,
      },
    });

    if (existing) {
      await this.savedMessageRepository.remove(existing);
      return { action: 'removed' };
    }

    await this.savedMessageRepository.save({
      user,
      ...(scoped.scope === 'CHANNEL'
        ? { channelMessage: scoped.message }
        : { dmMessage: scoped.message }),
    });

    return { action: 'added' };
  }

  async getSavedMessages(user: User) {
    return this.savedMessageRepository.find({
      where: { user: { id: user.id } },
      relations: [
        'channelMessage',
        'channelMessage.sender',
        'dmMessage',
        'dmMessage.sender',
      ],
      order: { savedAt: 'DESC' },
    });
  }
}
