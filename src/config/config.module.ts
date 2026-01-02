// src/config/config.module.ts
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { appConfig, appEnvSchema, dbConfig, dbEnvSchema, gcsConfig, gcsEnvSchema, redisConfig, redisEnvSchema, socialConfig, socialEnvSchema } from ".";
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production'
        ? '.env/production.env'
        : '.env/development.env',
      load: [
        appConfig,
        dbConfig,
        redisConfig,
        gcsConfig,
        socialConfig,
      ],
      validationSchema: Joi.object({
        ...appEnvSchema,
        ...dbEnvSchema,
        ...redisEnvSchema,
        ...gcsEnvSchema,
        ...socialEnvSchema,
      }),
    }),
  ],
})
export class ConfigRootModule {}