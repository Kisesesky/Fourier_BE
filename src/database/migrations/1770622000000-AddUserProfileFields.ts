import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileFields1770622000000 implements MigrationInterface {
  name = "AddUserProfileFields1770622000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" text`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "backgroundImageUrl" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "backgroundImageUrl"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "bio"`);
  }
}
