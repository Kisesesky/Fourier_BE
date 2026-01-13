import { ApiProperty } from "@nestjs/swagger";
import { ProjectRole } from "../constants/project-role.enum";

export class ProjectMemberResponseDto {
  @ApiProperty({ example: 'user-uuid' })
  userId: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiProperty({ enum: ProjectRole })
  role: ProjectRole;
}