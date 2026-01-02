// src/config/gcs/env.schema.ts
import * as Joi from 'joi';

export const gcsEnvSchema = {
	GCS_STORAGE_KEYFILE: Joi.string().required(),
	GCS_SECRET_NAME: Joi.string().required(),
	GCS_STORAGE_BUCKET: Joi.string().required(),
	GCS_STORAGE_PROJECT_ID: Joi.string().required(),
};