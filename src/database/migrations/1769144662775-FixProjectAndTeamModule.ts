import { MigrationInterface, QueryRunner } from "typeorm";

export class FixProjectAndTeamModule1769144662775 implements MigrationInterface {
    name = 'FixProjectAndTeamModule1769144662775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."project_status_enum" AS ENUM('ACTIVE', 'DRAFT', 'DISABLED')`);
        await queryRunner.query(`ALTER TABLE "project" ADD "status" "public"."project_status_enum" NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "iconType" SET DEFAULT 'IMAGE'`);
        await queryRunner.query(`ALTER TABLE "team" ALTER COLUMN "iconType" SET DEFAULT 'IMAGE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "team" ALTER COLUMN "iconType" SET DEFAULT 'EMOJI'`);
        await queryRunner.query(`ALTER TABLE "project" ALTER COLUMN "iconType" SET DEFAULT 'EMOJI'`);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."project_status_enum"`);
    }

}
