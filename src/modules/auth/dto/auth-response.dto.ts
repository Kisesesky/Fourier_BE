import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto';
import { User } from 'src/modules/users/entities/user.entity';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ required: false })
  refreshToken?: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  constructor(
    tokens: { accessToken: string; refreshToken?: string },
    user: User,
  ) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.user = new UserResponseDto(user);
  }
}