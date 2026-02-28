// src/config/app/env.schema.ts
import * as Joi from 'joi';

export const appEnvSchema = {
	JWT_SECRET: Joi.string().required(),
	JWT_REFRESH_SECRET: Joi.string().required(),
	ACCESS_EXPIRES_IN: Joi.string().required(),
	JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
	PORT: Joi.number().required(),
	FRONTEND_URL: Joi.string().required(),
	GMAIL_USER: Joi.string().required(),
	GMAIL_PASS: Joi.string().required(),
	SWAGGER_USER: Joi.string().required(),
	SWAGGER_PASSWORD: Joi.string().required(),
	NODE_ENV: Joi.string().valid('development', 'production').required(),
	DEFAULT_AVATAR: Joi.string().required(),
	SFU_ROOM_SNAPSHOT_TTL: Joi.number().required(),
};