// src/config/db/env.schema.ts
import * as Joi from 'joi';

export const dbEnvSchema = {
	DB_HOST: Joi.string().required(),
	DB_PORT: Joi.number().required(),
	DB_USER: Joi.string().required(),
	DB_PASSWORD: Joi.string().required(),
	DB_NAME: Joi.string().required(),
};