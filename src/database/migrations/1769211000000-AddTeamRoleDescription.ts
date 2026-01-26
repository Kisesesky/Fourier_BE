import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamRoleDescription1769211000000 implements MigrationInterface {
  name = 'AddTeamRoleDescription1769211000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_role_policy" ADD "description" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_role_policy" DROP COLUMN "description"`);
  }
}
