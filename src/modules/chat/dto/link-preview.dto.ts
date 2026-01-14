// src/modules/chat/dto/link-preview.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class LinkPreviewDto {
  @ApiProperty()
  url: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  imageUrl?: string;

  @ApiProperty({ required: false })
  siteName?: string;
}