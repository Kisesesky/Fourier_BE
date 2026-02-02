import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { CalendarType } from '../constants/calendar-type.enum';

export class UpdateCalendarDto {
  @ApiPropertyOptional({ example: '개인 캘린더' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ enum: CalendarType })
  @IsOptional()
  @IsEnum(CalendarType)
  type?: CalendarType;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'folder-uuid' })
  @IsOptional()
  @ValidateIf((obj) => obj.folderId !== null)
  @IsUUID('4')
  folderId?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
