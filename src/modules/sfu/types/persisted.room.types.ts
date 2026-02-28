import { MediaState } from "./media.types";

export type PersistedRoomSnapshot = {
  roomId: string;
  peers: string[];
  mediaStates: Record<string, MediaState>;
  updatedAt: number;
};