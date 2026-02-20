// src/common/dto/base-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export abstract class BaseResponseDto {
  @ApiProperty({ example: 1, description: '고유 ID' })
  id: string;

  @ApiProperty({ example: '2023-10-26T09:55:00.000Z', description: '생성 시간' })
  createdAt: Date;

  @ApiProperty({ example: '2023-10-26T09:55:00.000Z', description: '마지막 업데이트 시간' })
  updatedAt: Date;

  constructor(entity: any) {
      this.id = entity.id
      this.createdAt = entity.createdAt
      this.updatedAt = entity.updatedAt
  }
}