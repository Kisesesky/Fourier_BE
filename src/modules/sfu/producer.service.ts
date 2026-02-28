// src/modules/sfu/producer.service.ts
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediasoupService } from './mediasoup.service';
import { RoomService } from './room.service';
import { TrackKind } from './types/media.types';
import { ProducerState } from './types/producer.types';
import { SfuStore } from './sfu.store';

@Injectable()
export class ProducerService {
  constructor(
    private readonly store: SfuStore,
    private readonly roomService: RoomService,
    private readonly mediasoupService: MediasoupService,
  ) {}

  async produce(params: {
    roomId: string;
    userId: string;
    transportId: string;
    kind: TrackKind;
    rtpParameters: any;
    appData?: Record<string, any>;
  }) {
    const transport = this.store.transports.get(params.transportId);

    if (!transport || transport.userId !== params.userId || transport.direction !== 'send') {
      throw new Error('Invalid send transport');
    }

    const room = this.roomService.ensureRoom(params.roomId);
    const peer = room.peers.get(params.userId);

    if (!peer) throw new Error('Peer not joined');

    if (this.mediasoupService.isAvailable() && transport.transport) {
      const mediaKind: 'audio' | 'video' = params.kind === 'audio' ? 'audio' : 'video';
      const producer = await transport.transport.produce({
        kind: mediaKind,
        rtpParameters: params.rtpParameters,
        appData: {
          ...(params.appData || {}),
          track: params.kind,
        },
      });
      const state: ProducerState = {
        id: producer.id,
        roomId: params.roomId,
        userId: params.userId,
        transportId: params.transportId,
        kind: params.kind,
        rtpParameters: params.rtpParameters,
        appData: params.appData,
        producer,
      };
      this.store.producers.set(producer.id, state);
      peer.producers.add(producer.id);
      producer.on('transportclose', () => {
        this.store.producers.delete(producer.id);
        peer.producers.delete(producer.id);
      });
      return { id: producer.id, kind: params.kind };
    }

    const id = randomUUID();
    const state: ProducerState = {
      id,
      roomId: params.roomId,
      userId: params.userId,
      transportId: params.transportId,
      kind: params.kind,
      rtpParameters: params.rtpParameters,
      appData: params.appData,
    };
    this.store.producers.set(id, state);
    peer.producers.add(id);
    return { id, kind: params.kind };
  }

  closeProducer(roomId: string, userId: string, producerId: string) {
    const room = this.store.rooms.get(roomId);
    if (!room) return;
    const peer = room.peers.get(userId);
    if (!peer) return;

    peer.producers.delete(producerId);
    const producer = this.store.producers.get(producerId);
    if (producer?.producer) producer.producer.close();
    this.store.producers.delete(producerId);

    const consumersToDelte = [...this.store.consumers.entries()].filter(
      ([, consumer]) => consumer.producerId === producerId,
    );

    for (const [consumerId, consumer] of consumersToDelte) {
      if (consumer.consumer) consumer.consumer.close();
      const consumerPeer = room.peers.get(consumer.userId);
      consumerPeer?.consumers.delete(consumerId);
      this.store.consumers.delete(consumerId);
    }
  }

  closeUserProducers(roomId: string, userId: string) {
    const room = this.store.rooms.get(roomId);
    if (!room) return [] as string[];
    const peer = room.peers.get(userId);
    if (!peer) return [] as string[];
    const producerIds = Array.from(peer.producers);
    for (const producerId of producerIds) {
      this.closeProducer(roomId, userId, producerId);
    }
    return producerIds;
  }

  listRoomProducers(roomId: string, exceptUserId?: string) {
    const producers: Array<{ producerId: string; userId: string; kind: TrackKind }> = [];
    for (const producer of this.store.producers.values()) {
      if (producer.roomId !== roomId) continue;
      if (exceptUserId && producer.userId === exceptUserId) continue;
      producers.push({
        producerId: producer.id,
        userId: producer.userId,
        kind: producer.kind,
      });
    }
    return producers;
  }
}
