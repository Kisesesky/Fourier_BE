import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class WsSfuRequestDto {
  @IsOptional()
  @IsString()
  requestId?: string;
}

export class WsSfuJoinDto extends WsSfuRequestDto {
  @IsString()
  channelId: string;
}

export class WsSfuLeaveDto {
  @IsString()
  channelId: string;
}

export class WsSfuCreateTransportDto extends WsSfuRequestDto {
  @IsString()
  channelId: string;

  @IsIn(['send', 'recv'])
  direction: 'send' | 'recv';
}

export class WsSfuConnectTransportDto extends WsSfuRequestDto {
  @IsString()
  channelId: string;

  @IsString()
  transportId: string;

  @IsObject()
  dtlsParameters: any;
}

export class WsSfuProduceDto extends WsSfuRequestDto {
  @IsString()
  channelId: string;

  @IsString()
  transportId: string;

  @IsIn(['audio', 'video', 'screen'])
  kind: 'audio' | 'video' | 'screen';

  @IsObject()
  rtpParameters: any;

  @IsOptional()
  @IsObject()
  appData?: Record<string, any>;
}

export class WsSfuConsumeDto extends WsSfuRequestDto {
  @IsString()
  channelId: string;

  @IsString()
  transportId: string;

  @IsString()
  producerId: string;

  @IsObject()
  rtpCapabilities: any;
}

export class WsSfuCloseProducerDto {
  @IsString()
  channelId: string;

  @IsString()
  producerId: string;
}

export class WsSfuHostActionDto {
  @IsString()
  channelId: string;

  @IsString()
  targetUserId: string;
}

