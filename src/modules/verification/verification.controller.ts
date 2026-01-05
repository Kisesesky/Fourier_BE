import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { SendEmailCodeDto } from './dto/send-email-code.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { PasswordDto } from './dto/password.dto';

@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService
  ) {}

  @Post('sign-up/sendcode')
  async sendCode(@Body() sendEmailCodeDto: SendEmailCodeDto) {
    await this.verificationService.sendVerificationCode(sendEmailCodeDto.email);
    return { success: true, message: '인증 코드 전송 완료!, 유효 시간 5분'};
  }

  @Post('sign-up/verifycode')
  async verifyCode(@Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
    const result = await this.verificationService.verifyCode(verifyEmailCodeDto.email, verifyEmailCodeDto.code);
    if (!result) {
      throw new BadRequestException('인증 코드가 일치하지 않거나 만료된 코드입니다.');
    }
    return { success: true, message: '인증이 완료되었습니다.'};
  }

  @Post('find-password/sendcode')
  async verifyPasswordFindCode(@Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
    const message = await this.verificationService.sendPasswordFindEmail(verifyEmailCodeDto.email);
    return { success: true, message };
  }

  @Post('find-password/verifycode')
  async verifyPasswordCode(@Body() dto: VerifyEmailCodeDto) {
    const message = await this.verificationService.verifyPasswordFindCode(
      dto.email,
      dto.code,
    );
    return { success: true, message };
  }
}
