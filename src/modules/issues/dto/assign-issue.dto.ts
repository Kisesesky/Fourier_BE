// src/modules/issues/dto/assign-issue.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignIssueDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId: string;
}