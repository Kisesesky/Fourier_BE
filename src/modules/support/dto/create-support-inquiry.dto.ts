import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateSupportInquiryDto {
  @ApiProperty({ example: 'team-uuid' })
  @IsUUID()
  teamId: string;

  @ApiProperty({ example: 'project-uuid' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ example: '파일 업로드가 실패해요.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;
}
