import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsInt } from "class-validator";

// src/modules/chat/dto/get-message-context.dto.ts
export class GetMessageContextDto {
  @ApiProperty()
  messageId: string;
  
  @IsOptional()
  @IsInt()
  limit?: number; // default 20 (앞 10 / 뒤 10)
}