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

  joinRoom(JoinRoomDto: JoinRoomDto) {
    const joined = this.roomService.joinRoom(JoinRoomDto.roomId, JoinRoomDto.userId, JoinRoomDto.socketId);
    void this.snapshotService.persistRoomSnapshot(JoinRoomDto.roomId);
    return joined;
  }

  leaveRoom(leaveRoomDto: LeaveRoomDto) {
    this.roomService.leaveRoom(leaveRoomDto.roomId, leaveRoomDto.userId);
    void this.snapshotService.persistRoomSnapshot(leaveRoomDto.roomId);
  }

  leaveUserFromAllRooms(LeaveUserFromAllRoomsDto: LeaveUserFromAllRoomsDto) {
    const leftRoomIds = this.roomService.leaveUserFromAllRooms(LeaveUserFromAllRoomsDto.userId);
    this.persistSnapshots(leftRoomIds);
    return leftRoomIds;
  }

  createWebRtcTransport(createWebRtcTransportDto: CreateWebRtcTransportDto) {
    return this.transportService.createWebRtcTransport(createWebRtcTransportDto.roomId, createWebRtcTransportDto.userId, createWebRtcTransportDto.direction);
  }

  connectTransport(connectTransportDto: ConnectTransportDto) {
    return this.transportService.connectTransport(connectTransportDto.transportId, connectTransportDto.dtlsParameters);
  }

  async produce(produceDto: ProduceDto) {
    const produced = await this.producerService.produce(produceDto);
    this.persistSnapshot(produceDto.roomId);
    return produced;
  }

  consume(consumeDto: ConsumeDto) {
    return this.consumerService.consume(consumeDto);
  }

  closeProducer(closeProducerDto: CloseProducerDto) {
    this.producerService.closeProducer(closeProducerDto.roomId, closeProducerDto.userId, closeProducerDto.producerId);
    this.persistSnapshot(closeProducerDto.roomId);
  }

  closeUserProducers(closeUserProducersDto: CloseUserProducersDto) {
    const producerIds = this.producerService.closeUserProducers(closeUserProducersDto.roomId, closeUserProducersDto.userId);
    this.persistSnapshot(closeUserProducersDto.roomId);
    return producerIds;
  }

  listRoomProducers(listRoomProducersDto: ListRoomProducersDto) {
    return this.producerService.listRoomProducers(listRoomProducersDto.roomId, listRoomProducersDto.exceptUserId);
  }

  getUserMediaState(getUserMediaStateDto: GetUserMediaStateDto) {
    return this.roomService.getUserMediaState(getUserMediaStateDto.roomId, getUserMediaStateDto.userId);
  }

  listRoomMediaStates(listRoomMediaStatesDto: ListRoomMediaStatesDto) {
    return this.roomService.listRoomMediaStates(listRoomMediaStatesDto.roomId, listRoomMediaStatesDto.exceptUserId);
  }

  getPeerSocketId(getPeerSocketIdDto: GetPeerSocketIdDto) {
    return this.roomService.getPeerSocketId(getPeerSocketIdDto.roomId, getPeerSocketIdDto.userId);
  }

  getPersistedRoomSnapshot(getPersistedRoomSnapshotDto: GetPersistedRoomSnapshotDto) {
    return this.snapshotService.getPersistedRoomSnapshot(getPersistedRoomSnapshotDto.roomId, getPersistedRoomSnapshotDto.exceptUserId);
  }
}
