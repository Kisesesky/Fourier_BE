// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AppConfigModule } from 'src/config/app/config.module';
import { AppConfigService } from 'src/config/app/config.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { RefreshTokenService } from './services/refresh-token.service';
import { AuthTokenService } from './services/auth-token.service';
import { SocialConfigService } from 'src/config/social/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { RedisService } from 'src/config/redis/redis.service';
import { RedisConfigService } from 'src/config/redis/config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth]),
    AppConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => ({
        secret: appConfigService.jwtSecret,
        signOptions: {
          expiresIn: appConfigService.accessExpiresIn,
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt'})
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GitHubStrategy, KakaoStrategy, NaverStrategy, RefreshTokenService, AuthTokenService, SocialConfigService, RedisConfigService, RedisService],
  exports: [AuthService],
})
export class AuthModule {}