// src/modules/chat/dto/chat-room-target-user.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class ChatRoomTargetUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}
