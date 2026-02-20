// src/modules/auth/tokens/refresh-token.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { TimeUtil } from 'src/common/utils/time.util';
import { AppConfigService } from 'src/config/app/config.service';
import { RedisService } from 'src/config/redis/redis.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly redisService: RedisService,
    private readonly appConfigService: AppConfigService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = this.hash(refreshToken);
    const ttlSeconds = TimeUtil.convertExpiresInToMs(
      this.appConfigService.jwtRefreshExpiresIn,
    )
    await this.redisService.set(
      `refresh:${userId}`,
      hashed,
      ttlSeconds,
    );
  }

  async validate(userId: string, refreshToken: string) {
    let stored: string | null;
    
    try {
      stored = await this.redisService.get(`refresh:${userId}`);
    } catch (err) {
      throw new UnauthorizedException('Authentication temporarilly unavailable')
    }
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