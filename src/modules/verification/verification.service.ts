import { Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { AppConfigService } from 'src/config/app/config.service';
import { getVerificationCodeTemplate } from './templates/email-code-templates';
import { UsersService } from '../users/users.service';
import { RedisService } from 'src/config/redis/redis.service';

type VerificationType = 'signup' | 'password';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private trasporter: Transporter;

  constructor(
    private redisService: RedisService,
    private appConfigService: AppConfigService,
    private usersService: UsersService,
  ) {
    this.trasporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.appConfigService.gmailUser,
        pass: this.appConfigService.gmailPass,
      },
    });
  }

  private getVerificationKey(email: string, type: VerificationType) {
    return `verification:${type}:${email}`;
  }

  private getVerifiedKey(email: string, type: VerificationType) {
    return `verified:${type}:${email}`;
  }

  async sendVerificationCode(to: string, type: VerificationType = 'signup'): Promise<void> {
    const cooldownKey = `email-cooldonw:${to}`;
    const cooldown = await this.redisService.get(cooldownKey);
    if (cooldown) {
      throw new InternalServerErrorException('1분 후에 다시 시도해주세요!.');
    }

    const today = new Date().toISOString().slice(0,10); 
    const countKey = `email-count:${today}`;
    let count = Number(await this.redisService.get(countKey)) || 0;
    if (count >= 5) {
      throw new InternalServerErrorException('하루 최대 5회까지만 인증번호를 받을 수 있습니다.');
    }

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await this.redisService.set(this.getVerificationKey(to, type), code, 300); // 인증번호 유효시간 5분
      await this.redisService.set(cooldownKey, '1', 60); // 1분 쿨타임
      await this.redisService.set(countKey, String(count + 1), 24 * 60 *60); // 24시간 카운트

      const subject = type === 'signup' ? '회원가입을 위한 인증번호입니다.' : '비밀번호 재설정을 위한 인증번호입니다.';
      const html = getVerificationCodeTemplate(code, type);
      const mailOptions = {
        from: this.appConfigService.gmailUser,
        to,
        subject,
        html,
      };
      await this.trasporter.sendMail(mailOptions);

      if (this.appConfigService.nodeEnv === 'development') {
        this.logger.log(`인증코드:${code}`);
      }
    } catch (error) {
      this.logger.error('Cache Error:', error);
      throw new InternalServerErrorException('인증 코드 생성 중 오류가 발생하였습니다.');
    }
  }

  async verifyCode(email: string, code:string, type: VerificationType = 'signup'): Promise<boolean> {
    const storeCode = await this.redisService.get(this.getVerificationKey(email, type));
    if (!storeCode || storeCode.toString().trim() !== code.trim()) {
      this.logger.warn(`이메일: ${email}, 인증 코드 불일치 또는 만료 (입력코드: ${code})`);
      return false;
    }
    const verifiedTTL = type === 'password' ? 600 : 1800;

    await this.redisService.del(this.getVerificationKey(email, type));
    await this.redisService.set(this.getVerifiedKey(email, type), 'true', verifiedTTL);
    return true;
  }

  async isEmailVerified(email: string, type: VerificationType = 'signup'): Promise<boolean> {
    const verified = await this.redisService.get(this.getVerifiedKey(email, type));
    return verified === 'true';
  }

  async sendPasswordFindEmail(email: string): Promise<string> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('존재하지 않는 이메일입니다.');
    }

    await this.sendVerificationCode(email, 'password');
    return '인증 코드가 이메일로 발송되었습니다.'
  }

  async verifyPasswordFindCode(email: string, code: string): Promise<string> {
    const isVerified = await this.verifyCode(email, code, 'password');
    if (!isVerified) {
      throw new UnauthorizedException('잘못된 인증 코드입니다.');
    }
    return '인증이 완료되었습니다.';
  }

  async consumeVerification(email: string, type: VerificationType) {
    await this.redisService.del(this.getVerifiedKey(email, type));
  }
}
