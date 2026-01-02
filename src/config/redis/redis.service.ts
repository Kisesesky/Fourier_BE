// src/config/redis/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisConfigService } from './config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(
    private readonly redisConfigService: RedisConfigService,
  ) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.redisConfigService.redisHost,
      port: this.redisConfigService.redisPort,
      password: this.redisConfigService.redisPassword || undefined,
      maxRetriesPerRequest: this.redisConfigService.redisMax,
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }
}