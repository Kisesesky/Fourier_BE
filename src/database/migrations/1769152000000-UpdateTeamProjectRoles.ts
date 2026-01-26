import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTeamProjectRoles1769152000000 implements MigrationInterface {
  name = 'UpdateTeamProjectRoles1769152000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."team_member_role_enum" RENAME TO "team_member_role_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."team_member_role_enum" AS ENUM('OWNER', 'MANAGER', 'MEMBER', 'GUEST')`);
    await queryRunner.query(`ALTER TABLE "team_member" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "team_member"
      ALTER COLUMN "role" TYPE "public"."team_member_role_enum"
      USING CASE
        WHEN "role"::text = 'ADMIN' THEN 'MANAGER'
        ELSE "role"::text
      END::"public"."team_member_role_enum"
    `);
    await queryRunner.query(`ALTER TABLE "team_member" ALTER COLUMN "role" SET DEFAULT 'MEMBER'`);
    await queryRunner.query(`DROP TYPE "public"."team_member_role_enum_old"`);
    await queryRunner.query(`ALTER TYPE "public"."project_member_role_enum" RENAME TO "project_member_role_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."project_member_role_enum" AS ENUM('OWNER', 'MANAGER', 'MEMBER', 'GUEST')`);
    await queryRunner.query(`ALTER TABLE "project_member" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "project_member"
      ALTER COLUMN "role" TYPE "public"."project_member_role_enum"
      USING CASE
        WHEN "role"::text = 'MAINTAINER' THEN 'MANAGER'
        WHEN "role"::text = 'VIEWER' THEN 'GUEST'
        ELSE "role"::text
      END::"public"."project_member_role_enum"
    `);
    await queryRunner.query(`ALTER TABLE "project_member" ALTER COLUMN "role" SET DEFAULT 'MEMBER'`);
    await queryRunner.query(`DROP TYPE "public"."project_member_role_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."team_member_role_enum" RENAME TO "team_member_role_enum_new"`);
    await queryRunner.query(`CREATE TYPE "public"."team_member_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
    await queryRunner.query(`ALTER TABLE "team_member" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "team_member"
      ALTER COLUMN "role" TYPE "public"."team_member_role_enum"
      USING CASE
        WHEN "role"::text = 'MANAGER' THEN 'ADMIN'
        WHEN "role"::text = 'GUEST' THEN 'MEMBER'
        ELSE "role"::text
      END::"public"."team_member_role_enum"
    `);
    await queryRunner.query(`ALTER TABLE "team_member" ALTER COLUMN "role" SET DEFAULT 'MEMBER'`);
    await queryRunner.query(`DROP TYPE "public"."team_member_role_enum_new"`);

    await queryRunner.query(`ALTER TYPE "public"."project_member_role_enum" RENAME TO "project_member_role_enum_new"`);
    await queryRunner.query(`CREATE TYPE "public"."project_member_role_enum" AS ENUM('OWNER', 'MAINTAINER', 'MEMBER', 'VIEWER')`);
    await queryRunner.query(`ALTER TABLE "project_member" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "project_member"
      ALTER COLUMN "role" TYPE "public"."project_member_role_enum"
      USING CASE
        WHEN "role"::text = 'MANAGER' THEN 'MAINTAINER'
        WHEN "role"::text = 'GUEST' THEN 'VIEWER'
        ELSE "role"::text
      END::"public"."project_member_role_enum"
    `);
    await queryRunner.query(`ALTER TABLE "project_member" ALTER COLUMN "role" SET DEFAULT 'MEMBER'`);
    await queryRunner.query(`DROP TYPE "public"."project_member_role_enum_new"`);
  }
}
