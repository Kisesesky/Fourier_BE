import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthTokenService } from './services/auth-token.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { RefreshTokenService } from './services/refresh-token.service';
import { SignInDto } from './dto/sign-in.dto';
import { PasswordUtil } from 'src/common/utils/password.util';
import { CookieUtil } from 'src/common/utils/cookie.util';
import { RegisterStatus } from 'src/common/constants/register-status';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authTokenService: AuthTokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async validateCredentials(signInDto: SignInDto): Promise<User> {
    const user = await this.usersService.findByUserEmail(signInDto.email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
    };

    const isPasswordValid = await PasswordUtil.compare(signInDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
    };

    return user;
  }

  async signUp(signUpDto: SignUpDto): Promise<UserResponseDto> {
    const existing = await this.usersService.findByUserEmail(signUpDto.email);

    if (existing) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    const user = await this.usersService.createLocalUser(signUpDto);
    return new UserResponseDto(user);
  }

  async signIn(signInDto: SignInDto, origin: string): Promise<AuthResponseDto> {
    const user = await this.validateCredentials(signInDto);
    const tokens = this.authTokenService.generateTokens(user.id, origin);

    await this.refreshTokenService.saveRefreshToken(
      user.id,
      tokens.refreshToken,
    )
    return new AuthResponseDto (
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      user,
    );
  }

  async signOut(userId: string, origin: string) {
    // 서버 기준 세션 폐기, 
    await this.refreshTokenService.deleteRefreshToken(userId);

    const accessOptions = CookieUtil.getCookieOptions(0, origin, false);
    const refreshOptions = CookieUtil.getCookieOptions(0, origin, true);

    return {
      accessOptions,
      refreshOptions
    };
  }

  async validateSocialSignIn(
    profile: {
      provider: string;
      providerId: string;
      email: string;
      name?: string;
      avatar?: string;
    }
  ): Promise<User> {
    return this.usersService.findOrCreateSocialUser({
      provider: profile.provider as RegisterStatus,
      providerId: profile.providerId,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
    })
  }
}
