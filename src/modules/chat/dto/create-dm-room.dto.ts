import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class CreateDmRoomDto {
  @ApiProperty({ example: ['user-uuid'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  userIds: string[];
}
