//src/config/gcs/config.module.ts
import { Module } from '@nestjs/common';
import { GcsConfigService } from './config.service';


@Module({
  providers: [GcsConfigService],
  exports: [GcsConfigService],
})
export class GcsConfigModule {}