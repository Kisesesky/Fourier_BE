// src/modules/calendar/dto/update-calendar-category.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString } from 'class-validator';

export class UpdateCalendarCategoryDto {
  @ApiProperty({ example: '회의' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '#3788d8' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}