// src/modules/chat/dto/ws-send-dm.dto.ts
import { IsUUID, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../constants/message-type.enum';

export class WsSendDMDto {
  @ApiProperty({ example: 'dm-room-uuid' })
  @IsUUID()
  roomId: string;

  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  @IsEnum(MessageType)
  @IsOptional()
  type: MessageType;

  @ApiProperty({ example: '실시간 DM', required: false })
  @IsString()
  content?: string;

  @ApiProperty({ example: ['file-uuid'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  fileIds?: string[];

  @ApiProperty({ example: 'temp-uuid', required: false })
  @IsOptional()
  tempId?: string;
}