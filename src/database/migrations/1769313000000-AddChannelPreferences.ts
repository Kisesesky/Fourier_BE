import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChannelPreferences1769313000000 implements MigrationInterface {
  name = 'AddChannelPreferences1769313000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "channel_preference" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pinnedChannelIds" jsonb NOT NULL DEFAULT '[]',
        "archivedChannelIds" jsonb NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "projectId" uuid,
        "userId" uuid,
        CONSTRAINT "PK_channel_preference_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_channel_preference_project_user" UNIQUE ("projectId", "userId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_channel_preference_project" ON "channel_preference" ("projectId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_channel_preference_user" ON "channel_preference" ("userId")
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_preference"
      ADD CONSTRAINT "FK_channel_preference_project"
      FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "channel_preference"
      ADD CONSTRAINT "FK_channel_preference_user"
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "channel_preference" DROP CONSTRAINT "FK_channel_preference_user"`);
    await queryRunner.query(`ALTER TABLE "channel_preference" DROP CONSTRAINT "FK_channel_preference_project"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_channel_preference_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_channel_preference_project"`);
    await queryRunner.query(`DROP TABLE "channel_preference"`);
  }
}
