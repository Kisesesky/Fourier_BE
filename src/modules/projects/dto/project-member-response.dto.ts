import { ApiProperty } from "@nestjs/swagger";
import { ProjectRole } from "../constants/project-role.enum";

export class ProjectMemberResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiProperty({ example: 'user@example.com', nullable: true })
  email?: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.png', nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ enum: ProjectRole })
  role: ProjectRole;
}
