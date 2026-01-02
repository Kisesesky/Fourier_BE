// src/auth/strategies/naver.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { SocialConfigService } from 'src/config/social/config.service';
import { UsersService } from 'src/modules/users/users.service';
import { REGISTER_STATUS } from 'src/common/constants/register-status';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  private readonly logger = new Logger(NaverStrategy.name);

  constructor(
    private socialConfigService: SocialConfigService,
    private usersService: UsersService,
  ) {
    const { naverClientId, naverClientSecret, naverCallbackUrl } = socialConfigService;

    if (!naverClientId || !naverClientSecret || !naverCallbackUrl) {
      throw new Error('네이버 소셜 로그인 설정이 누락되었습니다.');
    }

    super({
      clientID: socialConfigService.naverClientId ?? '',
      clientSecret: socialConfigService.naverClientSecret ?? '',
      callbackURL: socialConfigService.naverCallbackUrl ?? '',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function
  ) {
    try {
      const { id, emails, displayName, _json } = profile;
      const email = emails && emails[0] ? emails[0].value : null;
      
      if (!email) {
        this.logger.error('[Naver Validate] 네이버 프로필에 이메일 없음.');
        return done(
          new UnauthorizedException(
            '네이버 계정에서 이메일 정보를 가져올 수 없습니다.',
          ),
        );
      }
      
      const user = await this.usersService.findOrCreateSocialUser({
        provider: REGISTER_STATUS.NAVER,
        providerId: id,
        email,
        name: displayName || _json?.nickname || email.split('@')[0],
        avatar: _json?.profile_image,
      });

      return done(null, user);
    } catch (error) {
      this.logger.error(`[Naver Validate] 유효성 검사 중 오류 발생: ${error.message}`, error.stack);
      return done(error);
    }
  }
}