import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIssuePriority1769401000000 implements MigrationInterface {
  name = 'AddIssuePriority1769401000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."issue_priority_enum" AS ENUM('VERY_LOW','LOW','MEDIUM','HIGH','URGENT')`);
    await queryRunner.query(`ALTER TABLE "issue" ADD "priority" "public"."issue_priority_enum" NOT NULL DEFAULT 'MEDIUM'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "priority"`);
    await queryRunner.query(`DROP TYPE "public"."issue_priority_enum"`);
  }
}
