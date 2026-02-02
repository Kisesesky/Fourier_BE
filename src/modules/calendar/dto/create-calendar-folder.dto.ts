import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCalendarFolderDto {
  @ApiProperty({ example: '내 캘린더' })
  @IsString()
  name: string;
}
