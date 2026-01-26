import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamRolePolicy1769210000000 implements MigrationInterface {
  name = 'AddTeamRolePolicy1769210000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "team_role_policy" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "permissions" jsonb NOT NULL DEFAULT '[]',
        "isSystem" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "teamId" uuid,
        CONSTRAINT "PK_8b6d5d2f2c0c7262c33e7c3a7b1" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "team_role_policy"
      ADD CONSTRAINT "FK_team_role_policy_team"
      FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "team_member"
      ADD "customRoleId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "team_member"
      ADD CONSTRAINT "FK_team_member_custom_role"
      FOREIGN KEY ("customRoleId") REFERENCES "team_role_policy"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_member" DROP CONSTRAINT "FK_team_member_custom_role"`);
    await queryRunner.query(`ALTER TABLE "team_member" DROP COLUMN "customRoleId"`);
    await queryRunner.query(`ALTER TABLE "team_role_policy" DROP CONSTRAINT "FK_team_role_policy_team"`);
    await queryRunner.query(`DROP TABLE "team_role_policy"`);
  }
}
