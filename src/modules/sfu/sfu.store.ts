import { Injectable } from '@nestjs/common';
import { ConsumerState } from './types/consumer.types';
import { ProducerState } from './types/producer.types';
import { RoomState } from './types/room.types';
import { TransportState } from './types/transport.types';

@Injectable()
export class SfuStore {
  readonly rooms = new Map<string, RoomState>();
  readonly transports = new Map<string, TransportState>();
  readonly producers = new Map<string, ProducerState>();
  readonly consumers = new Map<string, ConsumerState>();

  getStats() {
    return {
      roomCount: this.rooms.size,
      transportCount: this.transports.size,
      producerCount: this.producers.size,
      consumerCount: this.consumers.size,
    };
  }
}

