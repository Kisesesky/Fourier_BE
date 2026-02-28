// src/modules/sfu/transport.service.ts
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediasoupService } from './mediasoup.service';
import { RoomService } from './room.service';
import { TransportDirection } from './types/media.types';
import { TransportState } from './types/transport.types';
import { SfuStore } from './sfu.store';
import { AppConfigService } from 'src/config/app/config.service';

@Injectable()
export class TransportService {
  constructor(
    private readonly store: SfuStore,
    private readonly roomService: RoomService,
    private readonly mediasoupService: MediasoupService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async createWebRtcTransport(roomId: string, userId: string, direction: TransportDirection) {
    const room = this.roomService.ensureRoom(roomId);
    const peer = room.peers.get(userId);
    if (!peer) throw new Error('Peer not joined');

    await this.mediasoupService.ensureRoomRouter(room);
    const id = randomUUID();

    if (this.mediasoupService.isAvailable() && room.router) {
      const transport = await room.router.createWebRtcTransport({
        listenIps: [{ ip: '0.0.0.0', announcedIp: this.appConfigService.sfuAnnouncedIp }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });
      const state: TransportState = {
        id: transport.id,
        roomId,
        userId,
        direction,
        connected: false,
        transport,
      };
      this.store.transports.set(transport.id, state);
      peer.transports.add(transport.id);
      return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };
    }

    const state: TransportState = { id, roomId, userId, direction, connected: false };
    this.store.transports.set(id, state);
    peer.transports.add(id);
    return {
      id,
      iceParameters: { iceLite: true, usernameFragment: 'demo', password: 'demo' },
      iceCandidates: [],
      dtlsParameters: {
        role: 'auto',
        fingerprints: [{ algorithm: 'sha-256', value: '00:00:00' }],
      },
    };
  }

  async connectTransport(transportId: string, dtlsParameters: any) {
    const transport = this.store.transports.get(transportId);
    if (!transport) {
      throw new Error('Transport not found')
    }

    if (this.mediasoupService.isAvailable() && transport.transport) {
      await transport.transport.connect({ dtlsParameters });
    }

    transport.connected = true;
    transport.dtlsParameters = dtlsParameters;
    return { ok: true };
  }
}
