//src/config/social/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SocialConfigService {
  constructor(private readonly configService: ConfigService) {}

  get googleClientId(): string {
    return this.configService.getOrThrow('social.googleClientId');
  }

  get googleClientSecret(): string {
    return this.configService.getOrThrow('social.googleClientSecret');
  }

  get googleCallbackUrl(): string {
    return this.configService.getOrThrow('social.googleCallbackUrl');
  }

  get kakaoClientId(): string {
    return this.configService.getOrThrow('social.kakaoClientId');
  }

  get kakaoClientSecret(): string {
    return this.configService.getOrThrow('social.kakaoClientSecret');
  }

  get kakaoCallbackUrl(): string {
    return this.configService.getOrThrow('social.kakaoCallbackUrl');
  }

  get naverClientId(): string {
    return this.configService.getOrThrow('social.naverClientId');
  }

  get naverClientSecret(): string {
    return this.configService.getOrThrow('social.naverClientSecret');
  }

  get naverCallbackUrl(): string {
    return this.configService.getOrThrow('social.naverCallbackUrl');
  }

  get githubClientId(): string {
    return this.configService.getOrThrow('social.githubClientId');
  }

  get githubClientSecret(): string {
    return this.configService.getOrThrow('social.githubClientSecret');
  }

  get githubCallbackUrl(): string {
    return this.configService.getOrThrow('social.githubCallbackUrl');
  }
}