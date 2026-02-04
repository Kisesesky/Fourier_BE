import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIssueGroups1769400000000 implements MigrationInterface {
  name = 'AddIssueGroups1769400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "issue_group" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "color" character varying,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "projectId" uuid,
        CONSTRAINT "PK_issue_group_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_issue_group_project" ON "issue_group" ("projectId")`);
    await queryRunner.query(`
      ALTER TABLE "issue_group"
      ADD CONSTRAINT "FK_issue_group_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`ALTER TABLE "issue" ADD "groupId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "issue"
      ADD CONSTRAINT "FK_issue_group" FOREIGN KEY ("groupId") REFERENCES "issue_group"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_issue_group"`);
    await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "groupId"`);
    await queryRunner.query(`ALTER TABLE "issue_group" DROP CONSTRAINT "FK_issue_group_project"`);
    await queryRunner.query(`DROP INDEX "IDX_issue_group_project"`);
    await queryRunner.query(`DROP TABLE "issue_group"`);
  }
}
