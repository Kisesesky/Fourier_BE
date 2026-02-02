import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CalendarType } from '../constants/calendar-type.enum';

export class CreateCalendarDto {
  @ApiProperty({ example: '팀 캘린더' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiProperty({ enum: CalendarType })
  @IsEnum(CalendarType)
  type: CalendarType;

  @ApiProperty({ example: '#3b82f6', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 'folder-uuid', required: false })
  @IsOptional()
  @IsUUID('4')
  folderId?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
