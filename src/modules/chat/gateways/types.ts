// src/modules/chat/gateways/types.ts
export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}