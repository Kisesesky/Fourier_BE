// src/config/redis/env.schema.ts
import * as Joi from 'joi';

export const redisEnvSchema = {
	REDIS_HOST: Joi.string().required(),
	REDIS_PORT: Joi.number().required(),
	REDIS_PASSWORD: Joi.string().required(),
	REDIS_TTL: Joi.number().required(),
	REDIS_MAX: Joi.number().required(),
};