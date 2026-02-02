import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCalendarFolderDto {
  @ApiProperty({ example: '내 캘린더', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}
