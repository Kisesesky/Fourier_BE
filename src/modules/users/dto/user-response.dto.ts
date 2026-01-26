import { ApiProperty } from "@nestjs/swagger";
import { User } from "../entities/user.entity";
import { BaseResponseDto } from "src/common/dto/base-response.dto";

export class UserResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'test@example.com', description: '사용자 이메일', required: false })
  email: string;
  @ApiProperty({ example: 'user-uuid', description: '사용자 ID' })
  id: string;
  @ApiProperty({ example: 'tester', description: '사용자 이름', required: false })
  name: string;
  @ApiProperty({ example: 'tester', description: '사용자 표시 이름', required: false })
  displayName?: string;
  @ApiProperty({ example: 'https://example.com/avatar.png', description: '프로필 이미지', required: false })
  avatarUrl?: string;

  constructor(user: User) {
    super(user);
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.displayName = user.displayName ?? undefined;
    this.avatarUrl = user.avatarUrl ?? undefined;
  }
}
