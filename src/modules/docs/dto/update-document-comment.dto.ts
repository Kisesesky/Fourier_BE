import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateDocumentCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

