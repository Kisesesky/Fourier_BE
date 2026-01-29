import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamMemberAvatar1769312000000 implements MigrationInterface {
  name = "AddTeamMemberAvatar1769312000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_member" ADD "avatarUrl" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_member" DROP COLUMN "avatarUrl"`);
  }
}
