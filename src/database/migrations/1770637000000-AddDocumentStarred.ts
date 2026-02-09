import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentStarred1770637000000 implements MigrationInterface {
  name = 'AddDocumentStarred1770637000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "document" ADD COLUMN "starred" boolean NOT NULL DEFAULT false',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "document" DROP COLUMN "starred"');
  }
}

