// src/modules/sfu/sfu.facade.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { MediasoupService } from './mediasoup.service';
import { ProducerService } from './producer.service';
import { RoomService } from './room.service';
import { SnapshotService } from './snapshot.service';
import {
  CloseProducerDto,
  CloseUserProducersDto,
  ConnectTransportDto,
  ConsumeDto,
  CreateWebRtcTransportDto,
  GetPeerSocketIdDto,
  GetPersistedRoomSnapshotDto,
  GetUserMediaStateDto,
  JoinRoomDto,
  LeaveRoomDto,
  LeaveUserFromAllRoomsDto,
  ListRoomMediaStatesDto,
  ListRoomProducersDto,
  ProduceDto,
} from './types/sfu.facade.types';
import { TransportService } from './transport.service';

@Injectable()
export class SfuFacade {
  private readonly logger = new Logger(SfuFacade.name);
  
  constructor(
    private readonly mediasoupService: MediasoupService,
    private readonly roomService: RoomService,
    private readonly transportService: TransportService,
    private readonly producerService: ProducerService,
    private readonly consumerService: ConsumerService,
    private readonly snapshotService: SnapshotService,
  ) {}

  private persistSnapshot(roomId: string) {
    void this.snapshotService.persistRoomSnapshot(roomId).catch((err: Error) => {
      this.logger.error(`snapshot persist failed for room=${roomId}: ${err.message}`);
    });
  }

  private persistSnapshots(roomIds: string[]) {
    void Promise.all(
      roomIds.map((roomId) =>
        this.snapshotService.persistRoomSnapshot(roomId).catch((err: Error) => {
          this.logger.error(`snapshot persist failed for room=${roomId}: ${err.message}`);
        }),
      ),
    );
  }

  getRuntimeInfo() {
    return this.mediasoupService.getRuntimeInfo();
  }

  getRouterRtpCapabilities(roomId?: string) {
    return this.mediasoupService.getRouterRtpCapabilities(roomId);
  }

  joinRoom(dto: JoinRoomDto) {
    const joined = this.roomService.joinRoom(dto.roomId, dto.userId, dto.socketId);
    void this.snapshotService.persistRoomSnapshot(dto.roomId);
    return joined;
  }

  leaveRoom(dto: LeaveRoomDto) {
    this.roomService.leaveRoom(dto.roomId, dto.userId);
    void this.snapshotService.persistRoomSnapshot(dto.roomId);
  }

  leaveUserFromAllRooms(dto: LeaveUserFromAllRoomsDto) {
    const leftRoomIds = this.roomService.leaveUserFromAllRooms(dto.userId);
    this.persistSnapshots(leftRoomIds);
    return leftRoomIds;
  }

  createWebRtcTransport(dto: CreateWebRtcTransportDto) {
    return this.transportService.createWebRtcTransport(dto.roomId, dto.userId, dto.direction);
  }

  connectTransport(dto: ConnectTransportDto) {
    return this.transportService.connectTransport(dto.transportId, dto.dtlsParameters);
  }

  async produce(dto: ProduceDto) {
    const produced = await this.producerService.produce(dto);
    this.persistSnapshot(dto.roomId);
    return produced;
  }

  consume(dto: ConsumeDto) {
    return this.consumerService.consume(dto);
  }

  closeProducer(dto: CloseProducerDto) {
    this.producerService.closeProducer(dto.roomId, dto.userId, dto.producerId);
    this.persistSnapshot(dto.roomId);
  }

  closeUserProducers(dto: CloseUserProducersDto) {
    const producerIds = this.producerService.closeUserProducers(dto.roomId, dto.userId);
    this.persistSnapshot(dto.roomId);
    return producerIds;
  }

  listRoomProducers(dto: ListRoomProducersDto) {
    return this.producerService.listRoomProducers(dto.roomId, dto.exceptUserId);
  }

  getUserMediaState(dto: GetUserMediaStateDto) {
    return this.roomService.getUserMediaState(dto.roomId, dto.userId);
  }

  listRoomMediaStates(dto: ListRoomMediaStatesDto) {
    return this.roomService.listRoomMediaStates(dto.roomId, dto.exceptUserId);
  }

  getPeerSocketId(dto: GetPeerSocketIdDto) {
    return this.roomService.getPeerSocketId(dto.roomId, dto.userId);
  }

  getPersistedRoomSnapshot(dto: GetPersistedRoomSnapshotDto) {
    return this.snapshotService.getPersistedRoomSnapshot(dto.roomId, dto.exceptUserId);
  }
}
