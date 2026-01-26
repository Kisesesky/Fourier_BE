// src/modules/member/dto/search-members.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class SearchMembersDto {
  @ApiProperty({ example: 'tester', description: '검색 키워드 (이름)' })
  @IsString()
  @MinLength(1)
  keyword: string;

  @ApiProperty({ example: 'workspace-id', required: false })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
