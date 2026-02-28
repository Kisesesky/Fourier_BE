import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoomState } from './types/room.types';
import { SfuStore } from './sfu.store';

@Injectable()
export class MediasoupService implements OnModuleInit {
  private readonly logger = new Logger(MediasoupService.name);
  private mediasoupAvailable = false;
  private worker: any | null = null;

  constructor(private readonly store: SfuStore) {}

  async onModuleInit() {
    try {
      const dynamicImport = new Function("return import('mediasoup')");
      const mediasoupModule = await dynamicImport();
      this.worker = await mediasoupModule.createWorker({
        rtcMinPort: 40000,
        rtcMaxPort: 40100,
        logLevel: 'warn',
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
      codecs: [
        { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
        { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
      ],
      headerExtensions: [],
    };
  }

  async ensureRoomRouter(room: RoomState) {
    if (!this.mediasoupAvailable || !this.worker) return;
    if (room.router) return;
    room.router = await this.worker.createRouter({
      mediaCodecs: [
        { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
        { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
      ],
    });
  }
}

