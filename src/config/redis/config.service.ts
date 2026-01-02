//src/config/redis/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfigService {
  constructor(private readonly configService: ConfigService) {}

  get redisHost(): string {
    return this.configService.getOrThrow('redis.redisHost');
  }

  get redisPort(): number {
    return this.configService.getOrThrow('redis.redisPort');
  }

  get redisPassword(): string {
    return this.configService.getOrThrow('redis.redisPassword');
  }

  get redisTtl(): number {
    return this.configService.getOrThrow('redis.redisTtl');
  }

  get redisMax(): number {
    return this.configService.getOrThrow('redis.redisMax');
  }
}