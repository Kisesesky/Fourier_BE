import { ApiProperty } from "@nestjs/swagger";
import { User } from "../entities/user.entity";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'test@example.com', description: '사용자 이메일', required: false })
  email: string;

  constructor(user: User) {
    super(user);
    this.email = user.email;
  }
}