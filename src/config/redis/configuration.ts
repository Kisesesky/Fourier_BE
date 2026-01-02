//src/config/redis/configuration.ts
import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD || '',
  redisTtl: parseInt(process.env.REDIS_TTL ?? '300', 10),
  redisMax: parseInt(process.env.REDIS_MAX ?? '100', 10),
}));