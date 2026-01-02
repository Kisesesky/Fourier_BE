// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { AppConfigService } from 'src/config/app/config.service';
import { Request } from 'express';

// 쿠키에서 JWT 추출하는 함수
const extractJwtFromCookie = (req: Request) => {
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  return null;
};

// 헤더 또는 쿠키에서 JWT 추출하는 함수
const extractJwt = (req: Request) => {
  // 먼저 Authorization 헤더에서 찾기
  const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (token) {
    return token;
  }
  // 없으면 쿠키에서 찾기
  return extractJwtFromCookie(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private appConfigService: AppConfigService,
  ) {
    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
      secretOrKey: appConfigService.jwtSecret,
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.usersService.findByUserEmail(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    return { sub: payload.sub};
  }
}