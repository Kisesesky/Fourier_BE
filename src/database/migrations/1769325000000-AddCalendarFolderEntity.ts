import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCalendarFolderEntity1769325000000 implements MigrationInterface {
  name = 'AddCalendarFolderEntity1769325000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "calendar_folder" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "projectId" uuid,
        "createdById" uuid,
        CONSTRAINT "PK_calendar_folder_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_calendar_folder_project" ON "calendar_folder" ("projectId")`);
    await queryRunner.query(`
      ALTER TABLE "calendar_folder"
      ADD CONSTRAINT "FK_calendar_folder_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "calendar_folder"
      ADD CONSTRAINT "FK_calendar_folder_created_by" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`ALTER TABLE "calendar" ADD "folderId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "calendar"
      ADD CONSTRAINT "FK_calendar_folder" FOREIGN KEY ("folderId") REFERENCES "calendar_folder"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calendar" DROP CONSTRAINT "FK_calendar_folder"`);
    await queryRunner.query(`ALTER TABLE "calendar" DROP COLUMN "folderId"`);
    await queryRunner.query(`ALTER TABLE "calendar_folder" DROP CONSTRAINT "FK_calendar_folder_created_by"`);
    await queryRunner.query(`ALTER TABLE "calendar_folder" DROP CONSTRAINT "FK_calendar_folder_project"`);
    await queryRunner.query(`DROP INDEX "IDX_calendar_folder_project"`);
    await queryRunner.query(`DROP TABLE "calendar_folder"`);
  }
}
