import { ApiProperty } from '@nestjs/swagger';

export class CalendarFolderResponseDto {
  @ApiProperty({ example: 'folder-uuid' })
  id: string;

  @ApiProperty({ example: '기본' })
  name: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  createdById?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;
}
