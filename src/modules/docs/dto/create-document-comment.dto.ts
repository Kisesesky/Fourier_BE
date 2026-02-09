import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDocumentCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

