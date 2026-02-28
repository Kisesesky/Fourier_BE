// src/modules/sfu/snapshot.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/config/redis/redis.service';
import { PersistedRoomSnapshot } from './types/persisted.room.types';
import { MediaState } from './types/media.types';
import { RoomService } from './room.service';
import { SfuStore } from './sfu.store';

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);
  private readonly roomStateTtlSeconds = 60 * 60;

  constructor(
    private readonly redisService: RedisService,
    private readonly store: SfuStore,
    private readonly roomService: RoomService,
  ) {}

  getRoomSnapshotKey(roomId: string) {
    return `sfu:room:${roomId}:snapshot`;
  }

  async deleteRoomSnapshot(roomId: string) {
    try {
      await this.redisService.del(this.getRoomSnapshotKey(roomId));
    } catch (error: any) {
      this.logger.warn(`failed to delete snapshot for room=${roomId}: ${error?.message ?? 'unknown'}`);
    }
  }

  async persistRoomSnapshot(roomId: string) {
    const room = this.store.rooms.get(roomId);
    if (!room || room.peers.size === 0) {
      await this.deleteRoomSnapshot(roomId);
      return;
    }
    const snapshot: PersistedRoomSnapshot = {
      roomId,
      peers: Array.from(room.peers.keys()),
      mediaStates: this.roomService.listRoomMediaStates(roomId),
      updatedAt: Date.now(),
    };
    try {
      await this.redisService.set(
        this.getRoomSnapshotKey(roomId),
        JSON.stringify(snapshot),
        this.roomStateTtlSeconds,
      );
    } catch (error: any) {
      this.logger.warn(`failed to persist snapshot for room=${roomId}: ${error?.message ?? 'unknown'}`);
    }
  }

  async getPersistedRoomSnapshot(roomId: string, exceptUserId?: string): Promise<PersistedRoomSnapshot | null> {
    try {
      const raw = await this.redisService.get(this.getRoomSnapshotKey(roomId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedRoomSnapshot;
      if (!exceptUserId) return parsed;

      const filteredStates: Record<string, MediaState> = {};
      for (const [userId, state] of Object.entries(parsed.mediaStates || {})) {
        if (userId === exceptUserId) continue;
        filteredStates[userId] = state;
      }
      return {
        ...parsed,
        peers: (parsed.peers || []).filter((userId) => userId !== exceptUserId),
        mediaStates: filteredStates,
      };
    } catch (error: any) {
      this.logger.warn(`failed to read persisted snapshot for room=${roomId}: ${error?.message ?? 'unknown'}`);
      return null;
    }
  }
}
