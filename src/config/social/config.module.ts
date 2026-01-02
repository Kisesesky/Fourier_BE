//src/config/social/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialConfigService } from './config.service';

@Module({
  providers: [SocialConfigService],
  exports: [SocialConfigService],
})
export class SocialConfigModule {}