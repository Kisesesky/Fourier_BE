import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamMemberNickname1769310000000 implements MigrationInterface {
  name = "AddTeamMemberNickname1769310000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_member" ADD "nickname" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_member" DROP COLUMN "nickname"`);
  }
}
