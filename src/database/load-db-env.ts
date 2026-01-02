// src/DB/load-db-env.ts
import * as dotenv from 'dotenv';
import { join } from 'path';

/**
 * TypeORM CLI / bootstrap 전용
 * Nest Config와 동일한 DB ENV 계약을 강제
 */
export function loadDbEnv() {
  const envPath = process.env.NODE_ENV === 'production'
      ? '.env/production.env'
      : '.env/development.env';

  dotenv.config({ path: join(process.cwd(), envPath) });

  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
  ];

  for (const key of requiredVars) {
    if (!process.env[key]) {
      throw new Error(`❌ Missing required DB env: ${key}`);
    }
  }

  // 타입 정규화 (Nest config와 동일)
  process.env.DB_PORT = String(
    parseInt(process.env.DB_PORT!, 10),
  );
}