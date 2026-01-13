// src/modules/chat/dto/add-dm-participant.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddDmParticipantDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId: string;
}