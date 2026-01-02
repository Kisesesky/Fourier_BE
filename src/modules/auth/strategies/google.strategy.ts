// src/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { SocialConfigService } from 'src/config/social/config.service';
import { UsersService } from 'src/modules/users/users.service';
import { REGISTER_STATUS } from 'src/common/constants/register-status';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private socialConfigService: SocialConfigService,
    private usersService: UsersService,
  ) {
    const { googleClientId, googleClientSecret, googleCallbackUrl } = socialConfigService;

    if (!googleClientId || !googleClientSecret || !googleCallbackUrl) {
      throw new Error('구글 소셜 로그인 설정이 누락되었습니다.');
    }
    
    super({
      clientID: socialConfigService.googleClientId ?? '',
      clientSecret: socialConfigService.googleClientSecret ?? '',
      callbackURL: socialConfigService.googleCallbackUrl ?? '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      const email = emails && emails[0] ? emails[0].value : null;

      if (!email) {
        this.logger.error('[Google Validate] 구글 프로필에 이메일 없음.');
        return done(
          new UnauthorizedException(
            '구글 계정에서 이메일 정보를 가져올 수 없습니다.',
          ),
        );
      }

      const user = await this.usersService.findOrCreateSocialUser({
        provider: REGISTER_STATUS.GOOGLE,
        providerId: id,
        email,
        name: `${name.givenName} ${name.familyName}`,
        avatar: photos && photos[0] ? photos[0].value : null,
      });

      return done(null, user);
    } catch (error) {
      this.logger.error(`[Google Validate] 유효성 검사 중 오류 발생: ${error.message}`, error.stack);
      return done(error);
    }
  }
}