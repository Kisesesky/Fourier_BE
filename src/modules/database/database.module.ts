// src/modules/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbConfigModule } from 'src/config/db/config.module';
import { DbConfigService } from 'src/config/db/config.service';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [DbConfigModule],
      inject: [DbConfigService],
      useFactory: (dbConfigService: DbConfigService) => ({
        type: 'postgres',
        host: dbConfigService.dbHost,
        port: dbConfigService.dbPort || 5432,
        username: dbConfigService.dbUser,
        password: dbConfigService.dbPassword,
        database: dbConfigService.dbName,
        synchronize: false,
        entities: [
          join(__dirname, '../../**/*.entity.ts'),
          join(__dirname, '../../**/*.entity.js'),
        ],
        migrations: [
          join(__dirname, '../../../database/migrations/**/*.ts'),
          join(__dirname, '../../../database/migrations/**/*.js'),
        ],
        subscribers: [
          join(__dirname, '../../modules/**/subscribers/*.subscriber.ts'),
          join(__dirname, '../../modules/**/subscribers/*.subscriber.js'),
        ],
        extra: {
          options: '-c timezone=Asia/Seoul'
        },
        isGlobal: true,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}