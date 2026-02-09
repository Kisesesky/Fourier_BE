import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectFileVault1770642000000 implements MigrationInterface {
  name = 'AddProjectFileVault1770642000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "file_folder" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "projectId" uuid NOT NULL,
        CONSTRAINT "PK_file_folder_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "file" ADD COLUMN "projectId" uuid`);
    await queryRunner.query(`ALTER TABLE "file" ADD COLUMN "folderId" uuid`);

    await queryRunner.query(`CREATE INDEX "IDX_file_projectId" ON "file" ("projectId")`);
    await queryRunner.query(`CREATE INDEX "IDX_file_folderId" ON "file" ("folderId")`);
    await queryRunner.query(`CREATE INDEX "IDX_file_folder_projectId" ON "file_folder" ("projectId")`);

    await queryRunner.query(`
      ALTER TABLE "file_folder"
      ADD CONSTRAINT "FK_file_folder_project"
      FOREIGN KEY ("projectId") REFERENCES "project"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "file"
      ADD CONSTRAINT "FK_file_project"
      FOREIGN KEY ("projectId") REFERENCES "project"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "file"
      ADD CONSTRAINT "FK_file_folder"
      FOREIGN KEY ("folderId") REFERENCES "file_folder"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_file_folder"`);
    await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_file_project"`);
    await queryRunner.query(`ALTER TABLE "file_folder" DROP CONSTRAINT "FK_file_folder_project"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_file_folder_projectId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_file_folderId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_file_projectId"`);

    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "folderId"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "projectId"`);
    await queryRunner.query(`DROP TABLE "file_folder"`);
  }
}

