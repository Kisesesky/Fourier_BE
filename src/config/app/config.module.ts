//src/config/app/config.module.ts
import { Module } from '@nestjs/common';
import { AppConfigService } from './config.service';

@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}