// src/modules/calendar/dto/create-calendar-category.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsHexColor } from 'class-validator';

export class CreateCalendarCategoryDto {
  @ApiProperty({ example: '회의' })
  @IsString()
  name: string;

  @ApiProperty({ example: '#3788d8', required: false })
  @IsOptional()
  @IsHexColor()
  color?: string;
}