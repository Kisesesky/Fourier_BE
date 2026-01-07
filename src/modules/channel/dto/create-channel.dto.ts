// src/modules/channel/dto/create-channel.dto.ts
import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateChannelDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  name: string;

  @IsBoolean()
  isPrivate: boolean;

  @IsOptional()
  memberIds?: string[];
}