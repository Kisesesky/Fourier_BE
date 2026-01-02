//src/config/db/config.module.ts
import { Module } from '@nestjs/common';
import { DbConfigService } from './config.service';

@Module({
  providers: [DbConfigService],
  exports: [DbConfigService],
})
export class DbConfigModule {}