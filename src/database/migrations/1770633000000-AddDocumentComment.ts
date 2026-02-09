import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentComment1770633000000 implements MigrationInterface {
  name = 'AddDocumentComment1770633000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "document_comment" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "documentId" uuid,
        "authorId" uuid,
        CONSTRAINT "PK_document_comment_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_document_comment_document_id" ON "document_comment" ("documentId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_document_comment_author_id" ON "document_comment" ("authorId")',
    );
    await queryRunner.query(`
      ALTER TABLE "document_comment"
      ADD CONSTRAINT "FK_document_comment_document_id"
      FOREIGN KEY ("documentId") REFERENCES "document"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "document_comment"
      ADD CONSTRAINT "FK_document_comment_author_id"
      FOREIGN KEY ("authorId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "document_comment" DROP CONSTRAINT "FK_document_comment_author_id"');
    await queryRunner.query('ALTER TABLE "document_comment" DROP CONSTRAINT "FK_document_comment_document_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_document_comment_author_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_document_comment_document_id"');
    await queryRunner.query('DROP TABLE "document_comment"');
  }
}

