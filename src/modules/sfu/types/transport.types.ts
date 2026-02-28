import { TransportDirection } from "./media.types";

export type TransportState = {
  id: string;
  roomId: string;
  userId: string;
  direction: TransportDirection;
  connected: boolean;
  dtlsParameters?: any;
  transport?: any;
};