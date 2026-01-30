import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum PresenceStatusDto {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  DND = 'dnd',
}

export class UpdatePresenceStatusDto {
  @ApiProperty({ enum: PresenceStatusDto })
  @IsEnum(PresenceStatusDto)
  status: PresenceStatusDto;
}
