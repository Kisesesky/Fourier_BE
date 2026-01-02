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
}
