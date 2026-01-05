// src/common/utils/password-util.ts
import * as bcrypt from 'bcrypt'

export class PasswordUtil {

  static async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  static async compare(plain: string, hashed: string): Promise<boolean> {
    if (!hashed) return false;
    return await bcrypt.compare(plain, hashed)
  }

  static async validatePassword(password: string) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!regex.test(password)) {
      throw new Error(
        '비밀번호는 최소 8자 이상, 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.',
      );
    }
  }
}
