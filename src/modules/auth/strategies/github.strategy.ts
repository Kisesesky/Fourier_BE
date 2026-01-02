// src/auth/strategies/github.strategy.ts
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { UsersService } from "src/modules/users/users.service";
import { Strategy, Profile } from "passport-github"
import { REGISTER_STATUS } from "src/common/constants/register-status";
import { SocialConfigService } from "src/config/social/config.service";

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name);
  
  constructor(
    private socialConfigService: SocialConfigService,
    private usersService: UsersService,
  ) {
    const { githubClientId, githubClientSecret, githubCallbackUrl } = socialConfigService;

    if (!githubClientId || !githubClientSecret || !githubCallbackUrl) {
      throw new Error('깃허브 소셜 로그인 설정이 누락되었습니다.');
    }
    
    super({
      clientID: socialConfigService.githubClientId ?? '',
      clientSecret: socialConfigService.githubClientSecret ?? '',
      callbackURL: socialConfigService.githubCallbackUrl ?? '',
      scope: ['user:email'],
    });
  }

  async validate (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function,
  ) {
    try {
      const { id, username, emails, photos } = profile;
      const email = emails?.[0]?.value ?? null;

      if (!email) {
        this.logger.error('[GitHub Validate] GitHub 프로필에 이메일 없음.');
        return done(
          new UnauthorizedException(
            'GitHub 계정에서 이메일 정보를 가져올 수 없습니다.',
          ),
        );
      }

      const user = await this.usersService.findOrCreateSocialUser({
        provider: REGISTER_STATUS.GITHUB,
        providerId: id,
        email,
        name: username ?? email.split('@')[0],
        avatar: photos?.[0]?.value ?? null,
      });
      
      return done(null, user);
    } catch (error) {
      this.logger.error(
        `[GitHub Validate] 유효성 검사 중 오류 발생: ${error.message}`,
        error.stack,
      );
      return done(error);
    }
  }
}