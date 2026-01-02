// src/auth/strategies/kakao.strategy.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { REGISTER_STATUS } from 'src/common/constants/register-status';
import { SocialConfigService } from 'src/config/social/config.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  private readonly logger = new Logger(KakaoStrategy.name);

  constructor(
    private readonly socialConfigService: SocialConfigService,
    private readonly usersService: UsersService,
  ) {
    const { kakaoClientId, kakaoClientSecret, kakaoCallbackUrl } = socialConfigService;

    if (!kakaoClientId || !kakaoClientSecret || !kakaoCallbackUrl) {
      throw new Error('카카오 소셜 로그인 설정이 누락되었습니다.');
    }

    super({
      clientID: socialConfigService.kakaoClientId ?? '',
      clientSecret: socialConfigService.kakaoClientSecret ?? '',
      callbackURL: socialConfigService.kakaoCallbackUrl ?? '',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    try {
      const { id, _json } = profile;
      const kakaoAccount = _json.kakao_account;
      const email = kakaoAccount?.email;

      if (!email) {
        this.logger.error('[Kakao Validate] 카카오 프로필에 이메일 없음.');
        return done(
          new UnauthorizedException(
            '카카오 계정에서 이메일 정보를 가져올 수 없습니다.',
          ),
        );
      }

      const name = 
        kakaoAccount?.profile?.nickname || 
        _json?.properties?.nickname || 
        (email ? email.split('@')[0] : '사용자');
      const avatar = 
        kakaoAccount?.profile?.profile_image_url ||
        _json?.properties?.profile_image || 
        '';

      const user = await this.usersService.findOrCreateSocialUser({
        provider: REGISTER_STATUS.KAKAO,
        providerId: id.toString(),
        email,
        name,
        avatar,
      });
      
      return done(null, user);
    } catch (error) {
      this.logger.error(
        `[Kakao Validate] 유효성 검사 중 오류 발생: ${error.message}`,
        error.stack,
      );
      return done(error);
    }
  }
}  