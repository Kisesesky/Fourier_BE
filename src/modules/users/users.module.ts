// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AppConfigModule } from 'src/config/app/config.module';
import { GcsModule } from '../gcs/gcs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AppConfigModule,
    GcsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
