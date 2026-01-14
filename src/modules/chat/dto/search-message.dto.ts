// src/modules/chat/dto/search-message.dto.ts
import { IsString, IsOptional, IsInt } from "class-validator";

export class SearchMessageDto {
  @IsString()
  query: string;

  @IsOptional()
  scope?: 'CHANNEL' | 'DM';

  @IsOptional()
  scopeId?: string;

  @IsOptional()
  @IsInt()
  limit?: number = 20;
}