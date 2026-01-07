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
import { RefreshTokenService } from './tokens/refresh-token.service';
import { AuthTokenService } from './tokens/auth-token.service';
import { GcsModule } from '../gcs/gcs.module';
import { SocialConfigModule } from 'src/config/social/config.module';
import { RedisConfigModule } from 'src/config/redis/config.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [
    AppConfigModule,
    UsersModule,
    PassportModule,
    SocialConfigModule,
    GcsModule,
    RedisConfigModule,
    VerificationModule,
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
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GitHubStrategy, KakaoStrategy, NaverStrategy, RefreshTokenService, AuthTokenService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}