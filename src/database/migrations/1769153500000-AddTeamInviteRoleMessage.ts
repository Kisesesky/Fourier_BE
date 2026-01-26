import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamInviteRoleMessage1769153500000 implements MigrationInterface {
  name = 'AddTeamInviteRoleMessage1769153500000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_invite" ADD "role" "public"."team_member_role_enum" NOT NULL DEFAULT 'MEMBER'`);
    await queryRunner.query(`ALTER TABLE "team_invite" ADD "message" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_invite" DROP COLUMN "message"`);
    await queryRunner.query(`ALTER TABLE "team_invite" DROP COLUMN "role"`);
  }
}
