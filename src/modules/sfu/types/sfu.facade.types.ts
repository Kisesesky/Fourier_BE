import { TrackKind, TransportDirection } from './media.types';

export type JoinRoomDto = {
  roomId: string;
  userId: string;
  socketId: string;
};

export type LeaveRoomDto = {
  roomId: string;
  userId: string;
};

export type LeaveUserFromAllRoomsDto = {
  userId: string;
};

export type CreateWebRtcTransportDto = {
  roomId: string;
  userId: string;
  direction: TransportDirection;
};

export type ConnectTransportDto = {
  transportId: string;
  dtlsParameters: any;
};

export type ProduceDto = {
  roomId: string;
  userId: string;
  transportId: string;
  kind: TrackKind;
  rtpParameters: any;
  appData?: Record<string, any>;
};

export type ConsumeDto = {
  roomId: string;
  userId: string;
  transportId: string;
  producerId: string;
  rtpCapabilities: any;
};

export type CloseProducerDto = {
  roomId: string;
  userId: string;
  producerId: string;
};

export type CloseUserProducersDto = {
  roomId: string;
  userId: string;
};

export type ListRoomProducersDto = {
  roomId: string;
  exceptUserId?: string;
};

export type GetUserMediaStateDto = {
  roomId: string;
  userId: string;
};

export type ListRoomMediaStatesDto = {
  roomId: string;
  exceptUserId?: string;
};

export type GetPeerSocketIdDto = {
  roomId: string;
  userId: string;
};

export type GetPersistedRoomSnapshotDto = {
  roomId: string;
  exceptUserId?: string;
};

