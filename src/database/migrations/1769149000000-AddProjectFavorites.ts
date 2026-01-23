import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectFavorites1769149000000 implements MigrationInterface {
  name = 'AddProjectFavorites1769149000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "project_favorite" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "projectId" uuid,
        "userId" uuid,
        CONSTRAINT "PK_project_favorite_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_favorite_project_user" UNIQUE ("projectId", "userId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_project_favorite_project" ON "project_favorite" ("projectId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_project_favorite_user" ON "project_favorite" ("userId")
    `);
    await queryRunner.query(`
      ALTER TABLE "project_favorite"
      ADD CONSTRAINT "FK_project_favorite_project"
      FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "project_favorite"
      ADD CONSTRAINT "FK_project_favorite_user"
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project_favorite" DROP CONSTRAINT "FK_project_favorite_user"`);
    await queryRunner.query(`ALTER TABLE "project_favorite" DROP CONSTRAINT "FK_project_favorite_project"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_favorite_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_favorite_project"`);
    await queryRunner.query(`DROP TABLE "project_favorite"`);
  }
}
