import { ApiProperty } from '@nestjs/swagger';

export class IssueGroupResponseDto {
  @ApiProperty({ example: 'group-uuid' })
  id: string;

  @ApiProperty({ example: '메인업무' })
  name: string;

  @ApiProperty({ example: '#60a5fa', nullable: true })
  color?: string;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: '2026-02-04T00:00:00.000Z' })
  createdAt: Date;
}
