// src/database/data-source.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { loadDbEnv } from './load-db-env';

// 반드시 최상단에서 실행
loadDbEnv();

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,

  entities: [join(__dirname, '../modules/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/**/*{.ts,.js}')],
  subscribers: [
    join(__dirname, '../modules/**/subscribers/*.subscriber{.ts,.js}'),
  ],

  synchronize: false, // 절대 true 금지
  logging: false,

  extra: {
    options: '-c timezone=Asia/Seoul',
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);