// src/database/run-migrations.ts
import { AppDataSource } from './data-source';

export async function runMigrationsIfNeeded() {
  await AppDataSource.initialize();

  const queryRunner = AppDataSource.createQueryRunner();
  const hasMigrationsTable = await queryRunner.hasTable('migrations');

  if (!hasMigrationsTable) {
    console.log('🚀 First boot detected. Running migrations...');
    await AppDataSource.runMigrations();
  } else {
    console.log('✅ Database already initialized. Skipping migrations.');
  }

  await queryRunner.release();
}