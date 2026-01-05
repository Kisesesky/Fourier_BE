// src/modules/users/subscribers/users.subscriber.ts
import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { User } from '../entities/user.entity';
import { PasswordUtil } from 'src/common/utils/password.util';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  // User 엔티티가 DB에 삽입되기 전에 호출
  async beforeInsert(event: InsertEvent<User>) {
    if (event.entity.password) {
      event.entity.password = await PasswordUtil.hash(event.entity.password);
    }
  }
}