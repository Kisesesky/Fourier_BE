//src/config/redis/config.module.ts
import { Module } from '@nestjs/common';
import { RedisConfigService } from './config.service';
import { RedisService } from './redis.service';

@Module({
  providers: [RedisConfigService, RedisService],
  exports: [RedisConfigService, RedisService],
})
export class RedisConfigModule {}