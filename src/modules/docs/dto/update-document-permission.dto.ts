// src/modules/docs/dto/update-doc-permission.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { DocPermission } from '../constants/doc-permission.enum';
import { IsUUID, IsEnum } from 'class-validator';

export class UpdateDocPermissionDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: DocPermission, example: DocPermission.WRITE })
  @IsEnum(DocPermission)
  permission: DocPermission;
}