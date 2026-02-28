// src/modules/sfu/sfu.module.ts
import { Module } from '@nestjs/common';
import { RedisConfigModule } from 'src/config/redis/config.module';
import { ConsumerService } from './consumer.service';
import { MediasoupService } from './mediasoup.service';
import { ProducerService } from './producer.service';
import { RoomService } from './room.service';
import { SfuFacade } from './sfu.facade';
import { SfuStore } from './sfu.store';
import { SnapshotService } from './snapshot.service';
import { TransportService } from './transport.service';

@Module({
  imports: [RedisConfigModule],
  providers: [
    SfuStore,
    MediasoupService,
    RoomService,
    TransportService,
    ProducerService,
    ConsumerService,
    SnapshotService,
    SfuFacade,
  ],
  exports: [SfuFacade],
})
export class SfuModule {}
