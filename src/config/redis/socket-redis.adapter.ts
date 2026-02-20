import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext } from '@nestjs/common';
import { RedisConfigService } from './config.service';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    app: INestApplicationContext,
    private readonly redisConfig: RedisConfigService,
  ) {
    super(app);
  }

  async connectToRedis() {
    const pubClient = createClient({
      socket: {
        host: this.redisConfig.redisHost,
        port: this.redisConfig.redisPort,
      },
      password: this.redisConfig.redisPassword || undefined,
    });

    const subClient = pubClient.duplicate();

    try {
      await Promise.all([
        pubClient.connect(),
        subClient.connect(),
      ]);
    } catch (err) {
      console.error('Socket Redis connection failed');
      process.exit(1);
    }

    pubClient.on('error', (err) => {
      console.error('Socket Redis PUB Error', err);
    })
    
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}