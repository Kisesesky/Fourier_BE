import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { NotificationGateway } from './notification.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './constants/notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationrepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(data: {
    user: User;
    type: Notification['type'];
    payload: Notification['payload'];
  }) {
    const notification = this.notificationrepository.create(data);
    const saved = await this.notificationrepository.save(notification);

    // 실시간 푸시
    this.notificationGateway.push(saved);

    return saved;
  }

  async getMyNotifications(userId: string) {
    const notifications = await this.notificationrepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      read: notification.read,
      payload: notification.payload,
      createdAt: notification.createdAt,
    }))
  }

  async markRead(id: string, userId: string) {
    await this.notificationrepository.update(
      { id, user: { id: userId } },
      { read: true },
    );
  }

  async markAllRead(userId: string) {
    await this.notificationrepository.update(
      { user: { id: userId }, read: false },
      { read: true },
    );
  }

  async markInviteHandled(inviteId: string, userId: string) {
    await this.notificationrepository
      .createQueryBuilder()
      .update()
      .set({ read: true })
      .where('userId = :userId', { userId })
      .andWhere('type = :type', { type: NotificationType.INVITE })
      .andWhere(`payload @> :payload`, {
        payload: JSON.stringify({ inviteId }),
      })
      .execute();
  }

  async markFriendRequestHandled(memberId: string, userId: string) {
    await this.notificationrepository
      .createQueryBuilder()
      .update()
      .set({ read: true })
      .where('userId = :userId', { userId })
      .andWhere('type = :type', { type: NotificationType.FRIEND_REQUEST })
      .andWhere(`payload @> :payload`, {
        payload: JSON.stringify({ memberId }),
      })
      .execute();
  }
}
