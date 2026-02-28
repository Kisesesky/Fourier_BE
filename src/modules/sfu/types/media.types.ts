// src/modules/sfu/types/media.types.ts
export type TrackKind = 'audio' | 'video' | 'screen';

export type TransportDirection = 'send' | 'recv';

export type MediaState = {
  audio: boolean;
  video: boolean;
  screen: boolean;
};