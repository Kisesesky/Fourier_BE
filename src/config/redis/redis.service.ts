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

  async onModuleInit() {
    this.client = new Redis({
      host: this.redisConfigService.redisHost,
      port: this.redisConfigService.redisPort,
      password: this.redisConfigService.redisPassword || undefined,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 10) return null;
        return Math.min(times * 200, 3000);
      },
    });

    this.client.on('connect', () => {
      console.log('[Redis] Connected');
    });

    this.client.on('ready', () => {
      console.log('[Redis] Ready');
    });

    this.client.on('error', (err) => {
      console.error('[Redis] Error:', err);
    });

    this.client.on('close', () => {
      console.error('[Redis] Connection closed');
    });

    try {
      await this.client.ping();
      console.log('Redis Connected');
    } catch (err) {
      console.error('Redis Error', err)
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    if (this.client && this.client.status === 'ready') {
      await this.client.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return this.client.get(key);
    } catch (err) {
      console.error('Redis GET Error', err);
      throw new Error('Redis unavilable');
    }
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