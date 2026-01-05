// src/common/constans/register-status.ts
export const REGISTER_STATUS = {
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE',
  KAKAO: 'KAKAO',
  NAVER: 'NAVER',
  GITHUB: 'GITHUB'
} as const;

export type RegisterStatus = typeof REGISTER_STATUS[keyof typeof REGISTER_STATUS];

export type SocialRegisterStatus = Exclude<RegisterStatus, typeof REGISTER_STATUS.LOCAL>;

export interface SocialProfile {
  provider: SocialRegisterStatus;
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
}