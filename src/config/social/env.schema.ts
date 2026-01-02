// src/config/social/env.schema.ts
import * as Joi from 'joi';

export const socialEnvSchema = {
	GOOGLE_CLIENT_ID: Joi.string().required(),
	GOOGLE_CLIENT_SECRET: Joi.string().required(),
	GOOGLE_CALLBACK_URL: Joi.string().required(),
	KAKAO_CLIENT_ID: Joi.string().required(),
	KAKAO_CLIENT_SECRET: Joi.string().required(),
	KAKAO_CALLBACK_URL: Joi.string().required(),
	NAVER_CLIENT_ID: Joi.string().required(),
	NAVER_CLIENT_SECRET: Joi.string().required(),
	NAVER_CALLBACK_URL: Joi.string().required(),
	GITHUB_CLIENT_ID: Joi.string().required(),
  GITHUB_CLIENT_SECRET: Joi.string().required(),
  GITHUB_CALLBACK_URL: Joi.string().required(),
};