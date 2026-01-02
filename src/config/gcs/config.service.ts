//src/config/gcs/config.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as fs from 'fs/promises';
import * as path from 'path';


@Injectable()
export class GcsConfigService {
  private readonly logger = new Logger(GcsConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  get gcsKeyFile(): string | undefined {
    return this.configService.get('gcs.gcsKeyFile');
  }

  get gcsSecretName(): string {
    return this.configService.getOrThrow('gcs.gcsSecretName');
  }

  get gcsBucketName(): string {
    return this.configService.getOrThrow('gcs.gcsBucketName');
  }

  get gcsProjectId(): string {
    return this.configService.getOrThrow('gcs.gcsProjectId');
  }

  /**
   * 실행 시 Secret Manager에서 키를 받아 임시 파일로 저장, 경로 반환
   */
   async getKeyFilePath(): Promise<string> {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      // 개발 환경: .env의 GCS_STORAGE_KEYFILE 경로 사용
      return this.gcsKeyFile!;
    }
  
    const secretName = this.gcsSecretName;
    if (!secretName) throw new Error('GCS Secret 이름이 없습니다');
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({ name: secretName });
    const payload = version.payload?.data?.toString('utf8');
    if (!payload) throw new Error('서비스 계정 키 로드 실패');
    const tempPath = path.join('/tmp', 'gcp-service-account.json');
    await fs.writeFile(tempPath, payload, { mode: 0o600 }); // 퍼미션 최소화
    return tempPath;
  }
}