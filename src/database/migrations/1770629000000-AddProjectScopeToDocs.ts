import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectScopeToDocs1770629000000 implements MigrationInterface {
  name = 'AddProjectScopeToDocs1770629000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "folder" ADD COLUMN "projectId" uuid');
    await queryRunner.query('ALTER TABLE "document" ADD COLUMN "projectId" uuid');

    await queryRunner.query('CREATE INDEX "IDX_folder_project_id" ON "folder" ("projectId")');
    await queryRunner.query('CREATE INDEX "IDX_document_project_id" ON "document" ("projectId")');

    await queryRunner.query(
      'ALTER TABLE "folder" ADD CONSTRAINT "FK_folder_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "document" ADD CONSTRAINT "FK_document_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "document" DROP CONSTRAINT "FK_document_project_id"');
    await queryRunner.query('ALTER TABLE "folder" DROP CONSTRAINT "FK_folder_project_id"');

    await queryRunner.query('DROP INDEX "public"."IDX_document_project_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_folder_project_id"');

    await queryRunner.query('ALTER TABLE "document" DROP COLUMN "projectId"');
    await queryRunner.query('ALTER TABLE "folder" DROP COLUMN "projectId"');
  }
}
