import * as crypto from 'crypto'
(globalThis as any).crypto = crypto;
import { File } from 'undici';
(global as any).File = File;
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as basicAuth from 'express-basic-auth'
// Module
import { AppModule } from './app.module';
// Utils
import { runMigrationsIfNeeded } from './database/run-migrations';
import { AppConfigService } from './config/app/config.service';
import { RedisConfigService } from './config/redis/config.service';
import { RedisIoAdapter } from './config/redis/socket-redis.adapter';

async function bootstrap() {
  // Migration 선 실행 후 
  await runMigrationsIfNeeded();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const appConfigService = app.get(AppConfigService);

  const redisConfig = app.get(RedisConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, redisConfig);

  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS 설정 - 배포용
  app.enableCors({
    origin: appConfigService.frontendUrl.split(','), // 멀티 도메인 대응 가능
    credentials: true,
  });

  // Swagger 암호화 .env development시 개방형열람, 배포이후 production으로 설정시 암호화열람
  if (appConfigService.nodeEnv !== 'development') {
    app.use(
      ['/docs'],
      basicAuth({
        users: { 
          [appConfigService.swaggerUser]: 
          appConfigService.swaggerPassword,
        },
        challenge: true,
        unauthorizedResponse: () => 'Unauthorized',
      }),
    );
  }

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('FOURIER API')
    .setDescription('FOURIER API description')
    .setVersion('1.0')
    .addTag('users', '사용자 정보 관리 API') // 태그 추가 및 설명
    .addTag('auth', '인증 및 사용자 관련 API')
    .addTag('verification', '인증 관련 API')
    .addTag('gcs', 'GCS 관련 API')
    .addTag('workspace', 'Workspace 관련 API')
    .addTag('team', 'Team 관련 API')
    .addTag('projects', 'Project 관련 API')
    .addTag('members', '친구 관련 API')
    .addTag('chat', '채팅 관련 API')
    .addTag('docs', '문서 관련 API')
    .addTag('issues', '이슈 관련 API')
    .addTag('calendar', '캘린더 관련 API')
    .addTag('notifications', '알람 관련 API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .addServer('/api/v1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // health 설정
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  await app.listen(appConfigService.port, '0.0.0.0');
}
bootstrap();
