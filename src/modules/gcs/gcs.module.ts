// src/modules/gcs/gcs.module.ts
import { Module } from '@nestjs/common';
import { GcsService } from './gcs.service';
import { GcsConfigService } from 'src/config/gcs/config.service';
import { GcsServiceController } from './gcs.controller';
import { GcsConfigModule } from 'src/config/gcs/config.module';
import { AppConfigService } from 'src/config/app/config.service'; 
import { AppConfigModule } from 'src/config/app/config.module';

@Module({
  imports: [GcsConfigModule, AppConfigModule],
  controllers: [GcsServiceController],
  providers: [
    {
      provide: GcsService,
      useFactory: async (
        appConfigService: AppConfigService,
        gcsConfig: GcsConfigService,
        ) => {
        const keyFile = await gcsConfig.getKeyFilePath();
        return new GcsService(appConfigService, gcsConfig, keyFile);
      },
      inject: [AppConfigService, GcsConfigService],
    },
  ],
  exports: [GcsService],
})
export class GcsModule {}