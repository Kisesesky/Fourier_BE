import { Injectable } from '@nestjs/common';
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
  constructor(
    private readonly mediasoupService: MediasoupService,
    private readonly roomService: RoomService,
    private readonly transportService: TransportService,
    private readonly producerService: ProducerService,
    private readonly consumerService: ConsumerService,
    private readonly snapshotService: SnapshotService,
  ) {}

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
    void Promise.all(leftRoomIds.map((roomId) => this.snapshotService.persistRoomSnapshot(roomId)));
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
    await this.snapshotService.persistRoomSnapshot(dto.roomId);
    return produced;
  }

  consume(dto: ConsumeDto) {
    return this.consumerService.consume(dto);
  }

  closeProducer(dto: CloseProducerDto) {
    this.producerService.closeProducer(dto.roomId, dto.userId, dto.producerId);
    void this.snapshotService.persistRoomSnapshot(dto.roomId);
  }

  closeUserProducers(dto: CloseUserProducersDto) {
    const producerIds = this.producerService.closeUserProducers(dto.roomId, dto.userId);
    void this.snapshotService.persistRoomSnapshot(dto.roomId);
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
