// src/modules/sfu/constants/sfu.constants.ts
export const SFU_RTC_MIN_PORT = 40000;
export const SFU_RTC_MAX_PORT = 40100;

export const DEFAULT_MEDIA_CODECS = [
  { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
  { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
];