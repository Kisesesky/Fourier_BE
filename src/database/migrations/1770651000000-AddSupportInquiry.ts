import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupportInquiry1770651000000 implements MigrationInterface {
  name = 'AddSupportInquiry1770651000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "support_inquiry" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "message" text NOT NULL,
        "status" character varying NOT NULL DEFAULT 'OPEN',
        "source" character varying NOT NULL DEFAULT 'FLOATING_WIDGET',
        "teamId" uuid,
        "projectId" uuid,
        "requesterId" uuid,
        CONSTRAINT "PK_support_inquiry_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_support_inquiry_teamId" ON "support_inquiry" ("teamId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_inquiry_projectId" ON "support_inquiry" ("projectId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_inquiry_requesterId" ON "support_inquiry" ("requesterId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "support_inquiry"
      ADD CONSTRAINT "FK_support_inquiry_team"
      FOREIGN KEY ("teamId") REFERENCES "team"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "support_inquiry"
      ADD CONSTRAINT "FK_support_inquiry_project"
      FOREIGN KEY ("projectId") REFERENCES "project"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "support_inquiry"
      ADD CONSTRAINT "FK_support_inquiry_requester"
      FOREIGN KEY ("requesterId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "support_inquiry" DROP CONSTRAINT "FK_support_inquiry_requester"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_inquiry" DROP CONSTRAINT "FK_support_inquiry_project"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_inquiry" DROP CONSTRAINT "FK_support_inquiry_team"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_support_inquiry_requesterId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_support_inquiry_projectId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_support_inquiry_teamId"`);

    await queryRunner.query(`DROP TABLE "support_inquiry"`);
  }
}
