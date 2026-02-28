export type PeerState = {
  userId: string;
  socketId: string;
  transports: Set<string>;
  producers: Set<string>;
  consumers: Set<string>;
};