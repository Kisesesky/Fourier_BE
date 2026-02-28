// src/modules/sfu/mediasoup.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoomState } from './types/room.types';
import { SfuStore } from './sfu.store';
import { DEFAULT_MEDIA_CODECS, SFU_RTC_MAX_PORT, SFU_RTC_MIN_PORT } from './constants/sfu.constants';

@Injectable()
export class MediasoupService implements OnModuleInit {
  private readonly logger = new Logger(MediasoupService.name);
  private mediasoupAvailable = false;
  private worker: any | null = null;

  constructor(private readonly store: SfuStore) {}

  async onModuleInit() {
    if (!process.env.SFU_ANNOUNCED_IP) {
      this.logger.warn(
        'SFU_ANNOUNCED_IP is not set. WebRTC ICE connection will likely fail in production.',
      );
    }
    try {
      const dynamicImport = new Function("return import('mediasoup')");
      const mediasoupModule = await dynamicImport();
      this.worker = await mediasoupModule.createWorker({
        rtcMinPort: SFU_RTC_MIN_PORT,
        rtcMaxPort: SFU_RTC_MAX_PORT,
        logLevel: 'warn',
      });

      this.worker.on('died', (error: Error) => {
        this.mediasoupAvailable = false;
        this.logger.error(`mediasoup worker died: ${error.message}`);
      });
      this.mediasoupAvailable = true;
      this.logger.log('mediasoup worker initialized. SFU mode enabled.');
    } catch {
      this.mediasoupAvailable = false;
      this.worker = null;
      this.logger.warn('mediasoup is not installed. Running SFU signaling skeleton only.');
    }
  }

  isAvailable() {
    return this.mediasoupAvailable;
  }

  getRuntimeInfo() {
    return {
      mediasoupAvailable: this.mediasoupAvailable,
      ...this.store.getStats(),
    };
  }

  getRouterRtpCapabilities(roomId?: string) {
    const room = roomId ? this.store.rooms.get(roomId) : undefined;
    if (this.mediasoupAvailable && room?.router) {
      return room.router.rtpCapabilities;
    }
    return {
      codecs: DEFAULT_MEDIA_CODECS,
      headerExtensions: [],
    };
  }

  async ensureRoomRouter(room: RoomState) {
    if (!this.mediasoupAvailable || !this.worker) return;
    if (room.router) return;
    room.router = await this.worker.createRouter({
      mediaCodecs: DEFAULT_MEDIA_CODECS,
    });
  }
}
