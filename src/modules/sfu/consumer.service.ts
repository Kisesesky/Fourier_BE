// src/modules/sfu/consumer.service.ts
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediasoupService } from './mediasoup.service';
import { RoomService } from './room.service';
import { ConsumerState } from './types/consumer.types';
import { SfuStore } from './sfu.store';

@Injectable()
export class ConsumerService {
  constructor(
    private readonly store: SfuStore,
    private readonly roomService: RoomService,
    private readonly mediasoupService: MediasoupService,
  ) {}

  async consume(params: {
    roomId: string;
    userId: string;
    transportId: string;
    producerId: string;
    rtpCapabilities: any;
  }) {
    const transport = this.store.transports.get(params.transportId);
    const producer = this.store.producers.get(params.producerId);
    if (!transport || transport.userId !== params.userId || transport.direction !== 'recv') {
      throw new Error('Invalid recv transport');
    }
    if (!producer || producer.roomId !== params.roomId) {
      throw new Error('Producer not found');
    }

    const room = this.roomService.ensureRoom(params.roomId);
    const peer = room.peers.get(params.userId);
    if (!peer) throw new Error('Peer not joined');

    if (this.mediasoupService.isAvailable() && room.router && transport.transport) {
      if (!room.router.canConsume({ producerId: producer.id, rtpCapabilities: params.rtpCapabilities })) {
        throw new Error('Router cannot consume this producer');
      }
      const consumer = await transport.transport.consume({
        producerId: producer.id,
        rtpCapabilities: params.rtpCapabilities,
        paused: false,
      });
      const state: ConsumerState = {
        id: consumer.id,
        roomId: params.roomId,
        userId: params.userId,
        transportId: params.transportId,
        producerId: producer.id,
        kind: producer.kind,
        rtpParameters: consumer.rtpParameters,
        consumer,
      };
      this.store.consumers.set(consumer.id, state);
      peer.consumers.add(consumer.id);
      consumer.on('transportclose', () => {
        this.store.consumers.delete(consumer.id);
        peer.consumers.delete(consumer.id);
      });
      consumer.on('producerclose', () => {
        this.store.consumers.delete(consumer.id);
        peer.consumers.delete(consumer.id);
      });
      return {
        id: consumer.id,
        producerId: producer.id,
        kind: producer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      };
    }

    const id = randomUUID();
    const state: ConsumerState = {
      id,
      roomId: params.roomId,
      userId: params.userId,
      transportId: params.transportId,
      producerId: producer.id,
      kind: producer.kind,
      rtpParameters: producer.rtpParameters,
    };
    this.store.consumers.set(id, state);
    peer.consumers.add(id);
    return {
      id,
      producerId: producer.id,
      kind: producer.kind,
      rtpParameters: producer.rtpParameters,
      type: 'simple',
      producerPaused: false,
    };
  }
}
