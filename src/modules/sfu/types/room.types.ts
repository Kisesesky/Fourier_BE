import { PeerState } from "./peer.types";

export type RoomState = {
  id: string;
  peers: Map<string, PeerState>;
  router?: any;
};