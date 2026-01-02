// src/common/constatns/register-status.ts
export const REGISTER_STATUS = {
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE',
  KAKAO: 'KAKAO',
  NAVER: 'NAVER',
  GITHUB: 'GITHUB'
} as const;

export type RegisterStatus = typeof REGISTER_STATUS[keyof typeof REGISTER_STATUS];
