// src/modules/channel/dto/channel-list-item.dto.ts
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { Column } from "typeorm";

export class ChannelListItemDto {
  @IsString()
  channelId: string;

  @IsString()
  name: string;

  @IsBoolean()
  isPrivate: boolean;
  
  @IsNumber()
  unreadCount: number;
  
  @IsOptional()
  lastMessage: string | null;

  @IsOptional()
  lastMessageAt: Date | null;
}