// src/modules/sfu/mediasoup.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RoomState } from './types/room.types';
import { SfuStore } from './sfu.store';
import { DEFAULT_MEDIA_CODECS, SFU_RTC_MAX_PORT, SFU_RTC_MIN_PORT } from './constants/sfu.constants';
import { AppConfigService } from 'src/config/app/config.service';

@Injectable()
export class MediasoupService implements OnModuleInit {
  private readonly logger = new Logger(MediasoupService.name);

  private mediasoupAvailable = false;
  private mediasoupModule: any | null = null;
  private worker: any | null = null;
  private isRestarting = false;
  private restartAttempts = 0;
  private readonly maxRestartAttempts = 5;
  private readonly baseDelayMs = 3000;
  private readonly maxDelayMs = 30000;
  private restartTask: Promise<void> | null = null;

  constructor(
    private readonly store: SfuStore,
    private readonly eventEmitter: EventEmitter2,
    private readonly appConfigService: AppConfigService,
  ) {}

  async onModuleInit() {
    if (!this.appConfigService.sfuAnnouncedIp) {
      this.logger.warn('SFU_ANNOUNCED_IP가 설정되지 않았습니다. WebRTC ICE 연결이 실패할 수 있습니다.');
    }
    await this.startWorkerWithRetry();
  }

  private async importMediasoupOnce() {
    if (this.mediasoupModule) return;

    const dynamicImport = new Function("return import('mediasoup')");
    this.mediasoupModule = await dynamicImport();
  }
  
  private async createWorkerOnce() {
    await this.importMediasoupOnce();

    const worker = await this.mediasoupModule.createWorker({
      rtcMinPort: SFU_RTC_MIN_PORT,
      rtcMaxPort: SFU_RTC_MAX_PORT,
      logLevel: 'warn',
    });

    worker.on('died', (error: Error) => {
      void this.handleWorkerDied(error);
    });

    return worker;
  }

  private async handleWorkerDied(error: Error) {
    if (this.isRestarting) return;

    this.isRestarting = true;
    this.mediasoupAvailable = false;
    this.restartAttempts = 0;

    this.logger.error(`Mediasoup Worker died unexpectedly: ${error.message}. Will attempt restart.`);

    this.worker = null;
    this.invalidateAllRouters();

    this.eventEmitter.emit('sfu.worker.died');

    void this.startWorkerWithRetry();
  }

  private async startWorkerWithRetry() {
    if (!this.isRestarting && this.mediasoupAvailable && this.worker) return;

    if (this.restartTask) return this.restartTask;

    this.restartTask = (async () => {
      try {
        while (this.restartAttempts < this.maxRestartAttempts) {
          const attempt = this.restartAttempts + 1;
          const delayMs = Math.min(this.baseDelayMs * 2 ** this.restartAttempts, this.maxDelayMs);

          if (this.restartAttempts > 0) {
            this.logger.warn(`Restart attempt ${attempt}/${this.maxRestartAttempts} in ${delayMs}ms...`);
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
          } else {
            this.logger.warn(`Restart attempt ${attempt}/${this.maxRestartAttempts}...`);
          }

          try {
            const worker = await this.createWorkerOnce();
            this.worker = worker;
            this.mediasoupAvailable = true;
            this.restartAttempts = 0;
            this.isRestarting = false;
            this.eventEmitter.emit('sfu.worker.ready');

            this.logger.log('Mediasoup Worker is ready.');
            return;
          } catch (err: any) {
            this.restartAttempts++;
            this.mediasoupAvailable = false;
            this.worker = null;

            this.logger.error(`Failed to (re)start Mediasoup Worker (attempt ${attempt}/${this.maxRestartAttempts}): ${err?.message ?? 'unknown'}`);
          }
        }

        this.logger.error(`Worker restart failed ${this.maxRestartAttempts} times. Giving up and staying in fallback mode.`);
        this.isRestarting = false;
      } finally {
        this.restartTask = null;
      }
    })();

    return this.restartTask;
  }

  private invalidateAllRouters() {
    let count = 0;
    for (const room of this.store.rooms.values()) {
      if (!room.router) continue;

      try {
        room.router.close();
      } catch (error: any) {
        this.logger.warn(`Room Router close 실패: ${error?.message ?? 'unknown'}`);
      }
      room.router = undefined;
      count++;
    }

    if (count > 0) {
      this.logger.warn(`Room Router ${count}개 초기화됨. 기존 Peer는 재연결 필요.`);
    }
  }

  isAvailable() {
    return this.mediasoupAvailable;
  }

  restarting() {
    return this.isRestarting;
  }

  getRuntimeInfo() {
    return {
      mediasoupAvailable: this.mediasoupAvailable,
      isRestarting: this.isRestarting,
      restartAttempts: this.restartAttempts,
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
    // worker 없으면 그냥 return (fallback)
    if (!this.mediasoupAvailable || !this.worker) return;
    
    if (room.router) return;

    room.router = await this.worker.createRouter({
      mediaCodecs: DEFAULT_MEDIA_CODECS,
    });
  }
}
