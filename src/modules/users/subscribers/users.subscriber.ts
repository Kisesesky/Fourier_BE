// src/modules/users/subscribers/users.subscriber.ts
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
// Entity
import { User } from '../entities/user.entity';
// Utils
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

  // User 엔티티가 DB에서 업데이트 되기 전에 호출
  async beforeUpdate(event: UpdateEvent<User>) {
    if (event.entity && event.updatedColumns.some(col => col.propertyName === 'password')) {
      if (event.entity.password) {
        event.entity.password = await PasswordUtil.hash(event.entity.password);
      }
    }
  }
}