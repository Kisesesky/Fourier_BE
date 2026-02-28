// src/modules/sfu/room.service.ts
import { Injectable } from '@nestjs/common';
import { MediaState } from './types/media.types';
import { PeerState } from './types/peer.types';
import { SfuStore } from './sfu.store';

@Injectable()
export class RoomService {
  constructor(private readonly store: SfuStore) {}

  ensureRoom(roomId: string) {
    if (!this.store.rooms.has(roomId)) {
      this.store.rooms.set(roomId, { id: roomId, peers: new Map() });
    }
    return this.store.rooms.get(roomId)!;
  }

  joinRoom(roomId: string, userId: string, socketId: string) {
    const room = this.ensureRoom(roomId);
    if (!room.peers.has(userId)) {
      const peer: PeerState = {
        userId,
        socketId,
        transports: new Set(),
        producers: new Set(),
        consumers: new Set(),
      };
      room.peers.set(userId, peer);
    } else {
      this._cleanupPeerResources(roomId, userId)
      room.peers.get(userId)!.socketId = socketId;
    }
    return {
      roomId,
      peers: Array.from(room.peers.keys()),
    };
  }

  private _cleanupPeerResources(roomId: string, userId: string) {
    const room = this.store.rooms.get(roomId);
    if (!room) return;
    const peer = room.peers.get(userId);
    if (!peer) return;

    for (const consumerId of peer.consumers) {
      const consumerState = this.store.consumers.get(consumerId);
      if (consumerState?.consumer) {
        return consumerState.consumer.close();
      }
      this.store.consumers.delete(consumerId);
    }
    peer.consumers.clear();

    for (const producerId of peer.producers) {
      const producerState = this.store.producers.get(producerId);
      if (producerState?.producer) {
        return producerState.producer.close();
      }
      this.store.producers.delete(producerId);
    }
    peer.producers.clear();

    for (const transportId of peer.transports) {
      const transportState = this.store.transports.get(transportId);
      if (transportState?.transport) {
        return transportState.transport.close();
      }
      this.store.producers.delete(transportId);
    }
  }

  leaveRoom(roomId: string, userId: string) {
    const room = this.store.rooms.get(roomId);
    if (!room) return;
    const peer = room.peers.get(userId);
    if (!peer) return;

    for (const consumerId of peer.consumers) {
      const consumerState = this.store.consumers.get(consumerId);
      if (consumerState?.consumer) consumerState.consumer.close();
      this.store.consumers.delete(consumerId);
    }
    for (const producerId of peer.producers) {
      const producerState = this.store.producers.get(producerId);
      if (producerState?.producer) producerState.producer.close();
      this.store.producers.delete(producerId);
    }
    for (const transportId of peer.transports) {
      const transportState = this.store.transports.get(transportId);
      if (transportState?.transport) transportState.transport.close();
      this.store.transports.delete(transportId);
    }

    room.peers.delete(userId);
    if (room.peers.size === 0) {
      if (room.router) room.router.close();
      this.store.rooms.delete(roomId);
    }
  }

  leaveUserFromAllRooms(userId: string) {
    const leftRoomIds: string[] = [];
    for (const [roomId, room] of this.store.rooms.entries()) {
      if (!room.peers.has(userId)) continue;
      this.leaveRoom(roomId, userId);
      leftRoomIds.push(roomId);
    }
    return leftRoomIds;
  }

  getPeerSocketId(roomId: string, userId: string) {
    return this.store.rooms.get(roomId)?.peers.get(userId)?.socketId ?? null;
  }

  getUserMediaState(roomId: string, userId: string): MediaState {
    const base: MediaState = { audio: false, video: false, screen: false };
    for (const producer of this.store.producers.values()) {
      if (producer.roomId !== roomId || producer.userId !== userId) continue;
      if (producer.kind === 'audio') base.audio = true;
      if (producer.kind === 'video') base.video = true;
      if (producer.kind === 'screen') base.screen = true;
    }
    return base;
  }

  listRoomMediaStates(roomId: string, exceptUserId?: string) {
    const room = this.store.rooms.get(roomId);
    if (!room) return {};
    const states: Record<string, MediaState> = {};
    for (const userId of room.peers.keys()) {
      if (exceptUserId && userId === exceptUserId) continue;
      states[userId] = this.getUserMediaState(roomId, userId);
    }
    return states;
  }
}
