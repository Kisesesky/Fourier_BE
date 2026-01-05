// src/modules/auth/tokens/refresh-token.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from 'src/config/redis/redis.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly redisService: RedisService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async saveRefreshToken(userId: string, refreshToken: string, ttlSeconds = 60 * 60 * 24 * 30) {
    const hashed = this.hash(refreshToken);
    await this.redisService.set(
      `refresh:${userId}`,
      hashed,
      ttlSeconds,
    );
  }

  async validate(userId: string, refreshToken: string) {
    const stored = await this.redisService.get(`refresh:${userId}`);
    if (!stored) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const hashed = this.hash(refreshToken);
    if (stored !== hashed) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async deleteRefreshToken(userId: string) {
    await this.redisService.del(`refresh:${userId}`);
  }
}