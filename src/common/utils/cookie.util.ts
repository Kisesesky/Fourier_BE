// src/common/utils/cookie.util.ts
import { CookieOptions } from 'express';

export class CookieUtil {
  static getCookieOptions(
    maxAge: number,
    requestDomain: string,
    httpOnly = true,
  ): CookieOptions {
    const isLocal =
      requestDomain.includes('127.0.0.1') ||
      requestDomain.includes('localhost')
  
    return {
      path: '/',
      httpOnly,
      maxAge,
      sameSite: isLocal ? 'lax' : 'none', // cross-site 대응을 위해 'none'
      secure: !isLocal, // 로컬에서는 false
    };
  }
}