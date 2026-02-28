// src/modules/sfu/types/consumer.types.ts
import { TrackKind } from "./media.types";

export type ConsumerState = {
  id: string;
  roomId: string;
  userId: string;
  transportId: string;
  producerId: string;
  kind: TrackKind;
  rtpParameters: any;
  consumer?: any;
};