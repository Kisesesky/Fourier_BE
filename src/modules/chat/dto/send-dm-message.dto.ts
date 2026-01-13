// src/modules/chat/dto/send-dm.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsArray } from 'class-validator';
import { MessageType } from '../constants/message-type.enum';

export class SendDmMessageDto {
  @ApiProperty({ example: 'dm-room-uuid' })
  @IsUUID()
  roomId: string;

  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  type: MessageType;

  @ApiProperty({ example: 'DM 메시지입니다' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'FilesService에서 업로드된 파일 ID', example: ['file-uuid'] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  fileIds?: string[];
}