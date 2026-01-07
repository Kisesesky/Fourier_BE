import { Controller, Post, Body, Get, UseGuards, Req, Res, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { RequestOrigin } from 'src/common/decorators/request.origin';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthTokenService } from './tokens/auth-token.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Response } from 'express';
import { AppConfigService } from 'src/config/app/config.service';
import { KakaoAuthGuard } from './guards/kakao-auth.guard';
import { NaverAuthGuard } from './guards/naver-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { SocialProfile } from 'src/common/constants/register-status';
import { GcsService } from '../gcs/gcs.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangePasswordDto, PasswordDto } from '../verification/dto/password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authTokenService: AuthTokenService,
    private readonly appConfigService: AppConfigService,
    private readonly gcsService: GcsService,
  ) {}
    private async handleSocialCallback(
    socialProfile: SocialProfile,
    origin: string,
    res: Response,
  ) {
    // validateSocialSignIn을 통해 사용자를 찾거나 생성
    const user = await this.authService.validateSocialSignIn(socialProfile);

    if (!user.agreedTerms || !user.agreedPrivacy) {
      // 약관 미동의: 토큰 발급 없이 약관 동의 화면으로 리다이렉트
      // URL 뒤에 socialId 등(임시 식별값) 추가
      return res.redirect(
        `${this.appConfigService.frontendUrl}/auth/social-terms?socialId=${user.providerId}&provider=${user.provider}`,
      );
    }

    // 약관 동의된 회원만 JWT 및 쿠키 제공 (정상 로그인)
    const {
      accessToken,
      refreshToken,
      accessOptions,
      refreshOptions,
    } = this.authTokenService.generateTokens(user.email, origin);

    res.cookie('access_token', accessToken, accessOptions);
    res.cookie('refresh_token', refreshToken, refreshOptions);

    // 프론트엔드로 리다이렉션
    return res.redirect(
      `${this.appConfigService.frontendUrl}/auth/social/callback`,
    );
  }

  @ApiOperation({ summary: '내 정보 조회'})
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @Get('profile')
  getProfile(
    @RequestUser() user: User,
  ) {
    return new UserResponseDto(user);
  }

  @ApiOperation({ summary: '회원가입'})
  @Post('sign-up')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 5 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('이미지 파일만 업로드 할 수 있습니다.'), false);
      }
      cb(null, true);
    },
  }))
  async signUp (
    @UploadedFile() file: Express.Multer.File,
    @Body() signUpDto: SignUpDto,
  ) {
    const avatarUrl = file 
      ? await this.gcsService.uploadFile(file)
      : this.appConfigService.defaultAvatar;
    
    return this.authService.signUp({
      ...signUpDto,
      avatarUrl,
    });
  }

  @ApiOperation({ summary: '로그인'})
  @Post('sign-in')
  async signIn (
    @Body() signInDto: SignInDto,
    @RequestOrigin() origin: string,
  ) {
    return this.authService.signIn(signInDto, origin);
  }

  @ApiOperation({ summary: '로그아웃'})
  @Post('sign-out')
  async signOut (
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessOptions, refreshOptions } = await this.authService.signOut(user?.id, origin);

    res.cookie('access_token', '', accessOptions);
    res.cookie('refresh_token', '', refreshOptions);

    return {
      success: true,
      message: '성공적으로 로그아웃이 되었습니다.'
    };
  }

  @ApiOperation({ summary: '구글 로그인'})
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleSignIn() {
    // Passport가 자동 리다이렉트
    return;
  }

  @ApiOperation({ summary: '구글 콜백'})
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req,
    @RequestOrigin() origin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.handleSocialCallback(req.user, origin, res);
  }

  @ApiOperation({ summary: '카카오 로그인'})
  @UseGuards(KakaoAuthGuard)
  @Get('kakao')
  async kakaoSignIn() {
    // Passport가 자동 리다이렉트
    return;
  }

  @ApiOperation({ summary: '카카오 콜백'})
  @UseGuards(KakaoAuthGuard)
  @Get('kakao/callback')
  async kakaoCallback(
    @Req() req,
    @RequestOrigin() origin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.handleSocialCallback(req.user, origin, res);
  }

  @ApiOperation({ summary: '네이버 로그인'})
  @UseGuards(NaverAuthGuard)
  @Get('naver')
  async naverSignIn() {
    // Passport가 자동 리다이렉트
    return;
  }

  @ApiOperation({ summary: '네이버 콜백'})
  @UseGuards(NaverAuthGuard)
  @Get('naver/callback')
  async naverCallback(
    @Req() req,
    @RequestOrigin() origin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.handleSocialCallback(req.user, origin, res);
  }

  @ApiOperation({ summary: '깃허브 로그인'})
  @UseGuards(GitHubAuthGuard)
  @Get('github')
  async githubSignIn() {
    // Passport가 자동 리다이렉트
    return;
  }

  @ApiOperation({ summary: '깃허브 콜백'})
  @UseGuards(GitHubAuthGuard)
  @Get('github/callback')
  async githubCallback(
    @Req() req,
    @RequestOrigin() origin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.handleSocialCallback(req.user, origin, res);
  }

  @ApiOperation({ summary: '비밀번호 변경'})
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  async changePassword(
    @RequestUser() user: User,
    @RequestOrigin() origin: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const message = await this.authService.changePassword(
      user.email,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      changePasswordDto.confirmPassword,
    );

    const { accessToken, refreshToken, accessOptions, refreshOptions } = this.authTokenService.generateTokens(user.email, origin);

    return { success: true, message }
  }

  @ApiOperation({ summary: '비밀번호 초기화'})
  @Post('reset-password')
  async resetPassword(@Body() passwordDto: PasswordDto) {
    const message = await this.authService.resetPassword(passwordDto.email, passwordDto.newPassword, passwordDto.confirmPassword);
    return { success: true, message };
  }
}
