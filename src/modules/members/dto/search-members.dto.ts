// src/modules/member/dto/search-members.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchMembersDto {
  @ApiProperty({ example: '철수', description: '검색 키워드 (이름)' })
  @IsString()
  @MinLength(1)
  keyword: string;
}