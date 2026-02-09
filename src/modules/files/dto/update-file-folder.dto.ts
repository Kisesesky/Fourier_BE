import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateFileFolderDto {
  @ApiProperty({ example: '문서 폴더' })
  @IsString()
  name: string;
}

