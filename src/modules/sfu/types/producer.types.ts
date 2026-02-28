import { TrackKind } from "./media.types";

export type ProducerState = {
  id: string;
  roomId: string;
  userId: string;
  transportId: string;
  kind: TrackKind;
  rtpParameters: any;
  appData?: Record<string, any>;
  producer?: any;
};