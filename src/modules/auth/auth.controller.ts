import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { RequestOrigin } from 'src/common/decorators/request.origin';
import { UsersService } from '../users/users.service';
import { JwtPayload } from 'src/common/types/jwt-payload.type';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthTokenService } from './services/auth-token.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Response } from 'express';
import { AppConfigService } from 'src/config/app/config.service';
import { KakaoAuthGuard } from './guards/kakao-auth.guard';
import { NaverAuthGuard } from './guards/naver-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly authTokenService: AuthTokenService,
    private readonly appConfigService: AppConfigService,
  ) {}
  
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(
    @RequestUser() user: JwtPayload
  ) {
    return new UserResponseDto(
      await this.usersService.findByUserEmail(user.sub),
    );
  }

  @Post('signUp')
  async signUp (
    @Body() dto: SignUpDto,
  ) {
    return this.authService.signUp(dto);
  }

  @Post('signIn')
  async signIn (
    @Body() dto: SignInDto,
    @RequestOrigin() origin: string,
  ) {
    return this.authService.signIn(dto, origin);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('signOut')
  async signOut (
    @RequestUser() user: JwtPayload,
    @RequestOrigin() origin: string,
  ) {
    return this.authService.signOut(user.sub, origin);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleSignIn() {
    // Passport가 자동 리다이렉트
    return;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req,
    @RequestOrigin() origin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // req.user는 GoogleStrategy에서 done(null, userProfile)로 넘어온  객체
    const socialProfile = req.user; // socialProfile로 이름 변경하여 명확하게

    // validateSocialSignIn을 통해 사용자를 찾거나 생성
    const user = await this.authService.validateSocialSignIn(socialProfile);

    if (!user.agreedTerms || !user.agreedPrivacy) {
      // 약관 미동의: 토큰 발급 없이 약관 동의 화면으로 리다이렉트
      // URL 뒤에 socialId 등(임시 식별값) 추가
      return res.redirect(
        `${this.appConfigService.frontendUrl}/auth/social-terms?socialId=${user.providerId}&provider=${user.provider}`
      );
    }

    // 약관 동의된 회원만 JWT 및 쿠키 제공 (정상 로그인)
    const { accessToken, refreshToken, accessOptions, refreshOptions } = 
      this.authTokenService.generateTokens(user.email, origin);

    res.cookie('access_token', accessToken, accessOptions);
    res.cookie('refresh_token', refreshToken, refreshOptions);

    // 프론트엔드로 리다이렉션
    return res.redirect(`${this.appConfigService.frontendUrl}/auth/social/callback`);
  }

  @UseGuards(KakaoAuthGuard)
  @Get('kakao')
  async kakaoSignIn() {
    // Passport가 자동 리다이렉트
    return;
  }

  @UseGuards(KakaoAuthGuard)
  @Get('kakao/callback')
  async kakaoCallback(
    @Req() req,
    @RequestOrigin() origin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // req.user는 KakaoStrategy에서 done(null, userProfile)로 넘어온  객체
    const socialProfile = req.user; // socialProfile로 이름 변경하여 명확하게

    // validateSocialSignIn을 통해 사용자를 찾거나 생성
    const user = await this.authService.validateSocialSignIn(socialProfile);

    if (!user.agreedTerms || !user.agreedPrivacy) {
      // 약관 미동의: 토큰 발급 없이 약관 동의 화면으로 리다이렉트
      // URL 뒤에 socialId 등(임시 식별값) 추가
      return res.redirect(
        `${this.appConfigService.frontendUrl}/auth/social-terms?socialId=${user.providerId}&provider=${user.provider}`
      );
    }

    // 약관 동의된 회원만 JWT 및 쿠키 제공 (정상 로그인)
    const { accessToken, refreshToken, accessOptions, refreshOptions } = 
      this.authTokenService.generateTokens(user.email, origin);

    res.cookie('access_token', accessToken, accessOptions);
    res.cookie('refresh_token', refreshToken, refreshOptions);

    // 프론트엔드로 리다이렉션
    return res.redirect(`${this.appConfigService.frontendUrl}/auth/social/callback`);
  }

  @UseGuards(NaverAuthGuard)
  @Get('naver')
  async naverSignIn() {
    // Passport가 자동 리다이렉트
    return;
  }

  @UseGuards(NaverAuthGuard)
  @Get('naver/callback')
  async naverCallback(
    @Req() req,
    @RequestOrigin() origin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // req.user는 NaverStrategy에서 done(null, userProfile)로 넘어온  객체
    const socialProfile = req.user; // socialProfile로 이름 변경하여 명확하게

    // validateSocialSignIn을 통해 사용자를 찾거나 생성
    const user = await this.authService.validateSocialSignIn(socialProfile);

    if (!user.agreedTerms || !user.agreedPrivacy) {
      // 약관 미동의: 토큰 발급 없이 약관 동의 화면으로 리다이렉트
      // URL 뒤에 socialId 등(임시 식별값) 추가
      return res.redirect(
        `${this.appConfigService.frontendUrl}/auth/social-terms?socialId=${user.providerId}&provider=${user.provider}`
      );
    }

    // 약관 동의된 회원만 JWT 및 쿠키 제공 (정상 로그인)
    const { accessToken, refreshToken, accessOptions, refreshOptions } = 
      this.authTokenService.generateTokens(user.email, origin);

    res.cookie('access_token', accessToken, accessOptions);
    res.cookie('refresh_token', refreshToken, refreshOptions);

    // 프론트엔드로 리다이렉션
    return res.redirect(`${this.appConfigService.frontendUrl}/auth/social/callback`);
  }

  @UseGuards(GitHubAuthGuard)
  @Get('github')
  async githubSignIn() {
    // Passport가 자동 리다이렉트
    return;
  }

  @UseGuards(GitHubAuthGuard)
  @Get('github/callback')
  async githubCallback(
    @Req() req,
    @RequestOrigin() origin: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // req.user는 GithubStrategy에서 done(null, userProfile)로 넘어온  객체
    const socialProfile = req.user; // socialProfile로 이름 변경하여 명확하게

    // validateSocialSignIn을 통해 사용자를 찾거나 생성
    const user = await this.authService.validateSocialSignIn(socialProfile);

    if (!user.agreedTerms || !user.agreedPrivacy) {
      // 약관 미동의: 토큰 발급 없이 약관 동의 화면으로 리다이렉트
      // URL 뒤에 socialId 등(임시 식별값) 추가
      return res.redirect(
        `${this.appConfigService.frontendUrl}/auth/social-terms?socialId=${user.providerId}&provider=${user.provider}`
      );
    }

    // 약관 동의된 회원만 JWT 및 쿠키 제공 (정상 로그인)
    const { accessToken, refreshToken, accessOptions, refreshOptions } = 
      this.authTokenService.generateTokens(user.email, origin);

    res.cookie('access_token', accessToken, accessOptions);
    res.cookie('refresh_token', refreshToken, refreshOptions);

    // 프론트엔드로 리다이렉션
    return res.redirect(`${this.appConfigService.frontendUrl}/auth/social/callback`);
  }

}
