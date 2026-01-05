// src/modules/member/dto/update-member-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateMemberStatusDto {
  @ApiProperty({ example: 'uuid-of-request', description: '친구 요청 ID' })
  @IsUUID()
  memberId: string;
}