//src/config/db/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DbConfigService {
  constructor(private readonly configService: ConfigService) {}

  get dbHost(): string {
    return this.configService.getOrThrow('db.dbHost'); 
  }

  get dbPort(): number {
    return this.configService.getOrThrow('db.dbPort');
  }

  get dbUser(): string {
    return this.configService.getOrThrow('db.dbUser');
  }

  get dbPassword(): string {
    return this.configService.getOrThrow('db.dbPassword');
  }

  get dbName(): string {
    return this.configService.getOrThrow('db.dbName');
  }
}