import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsInt } from "class-validator";

// src/modules/chat/dto/get-message-context.dto.ts
export class GetMessageContextDto {
  @ApiProperty({ example: 'message-uuid' })
  messageId: string;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @IsInt()
  limit?: number; // default 20 (앞 10 / 뒤 10)
}