// src/modules/channel/dto/channel-message-response.dto.ts
import { IsBoolean, IsString, IsUUID } from "class-validator";
import { CreateDateColumn } from "typeorm";

export class ChannelMessageResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  content: string;

  @IsString()
  senderId: string;

  @CreateDateColumn()
  createdAt: Date;
  
  @IsBoolean()
  isDeleted: boolean;
}