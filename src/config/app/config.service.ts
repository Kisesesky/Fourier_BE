//src/config/app/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type JwtExpiresIn = `${number}${'s' | 'm' | 'h' | 'd'}`;

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get jwtSecret(): string {
    return this.configService.getOrThrow('app.jwtSecret');
  }

  get jwtRefreshSecret(): string {
    return this.configService.getOrThrow('app.jwtRefreshSecret');
  }

  get accessExpiresIn(): JwtExpiresIn {
    return this.configService.getOrThrow('app.accessExpiresIn') || '1h';
  }

  get jwtRefreshExpiresIn(): JwtExpiresIn {
    return this.configService.getOrThrow('app.jwtRefreshExpiresIn') || '30d';
  }

  get port(): number {
    return this.configService.getOrThrow('app.port');
  }

  get frontendUrl(): string {
    return this.configService.getOrThrow('app.frontendUrl') || '';
  }

  get gmailUser(): string {
    return this.configService.getOrThrow('app.gmailUser');
  }

  get gmailPass(): string {
    return this.configService.getOrThrow('app.gmailPass');
  }

  get swaggerUser(): string {
    return this.configService.getOrThrow('app.swaggerUser');
  }

  get swaggerPassword(): string {
    return this.configService.getOrThrow('app.swaggerPassword');
  }

  get nodeEnv(): string {
    return this.configService.getOrThrow('app.nodeEnv');
  }

  get defaultAvatar(): string {
    return this.configService.getOrThrow('app.defaultAvatar');
  }
}