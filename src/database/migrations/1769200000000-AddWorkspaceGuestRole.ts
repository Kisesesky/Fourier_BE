import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkspaceGuestRole1769200000000 implements MigrationInterface {
  name = 'AddWorkspaceGuestRole1769200000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."workspace_member_role_enum" ADD VALUE IF NOT EXISTS 'guest'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."workspace_member_role_enum" RENAME TO "workspace_member_role_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."workspace_member_role_enum" AS ENUM('owner', 'admin', 'member')`);
    await queryRunner.query(`
      ALTER TABLE "workspace_member"
      ALTER COLUMN "role" TYPE "public"."workspace_member_role_enum"
      USING CASE
        WHEN "role"::text = 'guest' THEN 'member'
        ELSE "role"::text
      END::"public"."workspace_member_role_enum"
    `);
    await queryRunner.query(`DROP TYPE "public"."workspace_member_role_enum_old"`);
  }
}
