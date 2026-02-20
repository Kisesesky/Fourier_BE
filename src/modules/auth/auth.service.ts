import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthTokenService } from './tokens/auth-token.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { RefreshTokenService } from './tokens/refresh-token.service';
import { SignInDto } from './dto/sign-in.dto';
import { PasswordUtil } from 'src/common/utils/password.util';
import { CookieUtil } from 'src/common/utils/cookie.util';
import { SocialProfile } from 'src/common/constants/register-status';
import { SignUpCommand } from './types/sign-up-command.type';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authTokenService: AuthTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly verificationService: VerificationService,
  ) {}

  async validateCredentials(signInDto: SignInDto): Promise<User> {
    const user = await this.usersService.findUserByEmail(signInDto.email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
    };

    const isPasswordValid = await PasswordUtil.compare(signInDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
    };

    return user;
  }

  async signUp(signUpCommand: SignUpCommand): Promise<UserResponseDto> {
    const existing = await this.usersService.findUserByEmail(signUpCommand.email);

    if (existing) {
      throw new BadRequestException('이미 가입된 이메일입니다.');
    }

    const user = await this.usersService.createLocalUser({
      ...signUpCommand,
      displayName: signUpCommand.displayName ?? signUpCommand.name
    });
    return new UserResponseDto(user);
  }

  async signIn(signInDto: SignInDto, origin: string): Promise<AuthResponseDto> {
    const user = await this.validateCredentials(signInDto);
    const tokens = this.authTokenService.generateTokens(user.id, origin);

    await this.refreshTokenService.deleteRefreshToken(user.id);
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
    await this.revokeSession(userId);
    const accessOptions = CookieUtil.getCookieOptions(0, origin, false);
    const refreshOptions = CookieUtil.getCookieOptions(0, origin, true);

    return {
      accessOptions,
      refreshOptions
    };
  }

  async validateSocialSignIn(
    profile: SocialProfile
  ): Promise<User> {
    return this.usersService.findOrCreateSocialUser({
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
    })
  }

  async revokeSession(userId: string) {
    await this.refreshTokenService.deleteRefreshToken(userId);
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<string> {
    const user = await this.usersService.findUserByEmail(email);

    if (!(await PasswordUtil.compare(currentPassword, user.password))) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('새 비밀번호가 일치하지 않습니다.');
    }

    PasswordUtil.validatePassword(newPassword);
    const hashedPassword = await PasswordUtil.hash(newPassword);
    await this.usersService.updatePassword(email, hashedPassword);
    await this.revokeSession(user.id);
    
    return '비밀번호가 성공적으로 변경되었습니다.';
  }

  async resetPassword(
    email: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<string> {
    const user = await this.usersService.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const isVerified = await this.verificationService.isEmailVerified(email, 'password');

    if (!isVerified) {
      throw new UnauthorizedException('이메일 인증이 필요합니다.')
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('새 비밀번호가 일치하지 않습니다.');
    }

    PasswordUtil.validatePassword(newPassword);
    const hashedPassword = await PasswordUtil.hash(newPassword);
    // 1. 비밀번호 업데이트
    await this.usersService.updatePassword(email, hashedPassword);
    // 2. 기존 세션 revoke
    await this.refreshTokenService.deleteRefreshToken(user.id);
    // 3. 인증 소비
    await this.verificationService.consumeVerification(email, 'password');
    
    return '비밀번호가 성공적으로 변경되었습니다.';
  }
}
