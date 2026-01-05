// src/common/validators/match-password.constraint.ts
import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchPassword', async: false })
@Injectable()
export class MatchPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as any;
    return object.newPassword === confirmPassword;
  }

  defaultMessage() {
    return '비밀번호가 일치하지 않습니다.';
  }
}