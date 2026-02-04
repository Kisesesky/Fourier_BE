import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateIssueGroupDto {
  @ApiPropertyOptional({ example: '메인업무' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '#60a5fa' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
