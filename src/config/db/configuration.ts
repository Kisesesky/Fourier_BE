//src/config/db/configuration.ts
import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  dbHost: process.env.DB_HOST,
  dbPort: parseInt(process.env.DB_PORT ?? '5432', 10),
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
}));