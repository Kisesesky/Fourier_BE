import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMentionModule1768896866962 implements MigrationInterface {
    name = 'AddMentionModule1768896866962'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_log" DROP CONSTRAINT "FK_dfcfb7c2c5086ec721868d85409"`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP CONSTRAINT "FK_aabf9895f9649b5bea6df2fd97e"`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP CONSTRAINT "FK_a1a94d2a4150a9c89e82a37c54d"`);
        await queryRunner.query(`CREATE TYPE "public"."mention_type_enum" AS ENUM('USER', 'TEAM', 'EVERYONE', 'ISSUE', 'CHAT', 'CALENDAR', 'DOC')`);
        await queryRunner.query(`CREATE TABLE "mention" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mentionedUserId" character varying NOT NULL, "actorId" character varying, "type" "public"."mention_type_enum" NOT NULL, "targetId" character varying NOT NULL, "teamId" character varying NOT NULL, "projectId" character varying, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9b02b76c4b65e3c35c1a545bf57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6f7a95ae46a8ef4d787808ac14" ON "mention" ("mentionedUserId", "targetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_81e9616cb4c5c0f18ec277950b" ON "mention" ("mentionedUserId", "createdAt") `);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fd38eb486cbfb9f8a75b01136"`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "actorId"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "actorId" character varying`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "teamId"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "teamId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "projectId"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "projectId" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."activity_log_targettype_enum" RENAME TO "activity_log_targettype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."activity_log_targettype_enum" AS ENUM('ISSUE', 'CALENDAR', 'DOC', 'CHAT', 'PROJECT', 'TEAM', 'USER')`);
        await queryRunner.query(`ALTER TABLE "activity_log" ALTER COLUMN "targetType" TYPE "public"."activity_log_targettype_enum" USING "targetType"::"text"::"public"."activity_log_targettype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."activity_log_targettype_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_2fd38eb486cbfb9f8a75b01136" ON "activity_log" ("projectId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_09824687dd642175b00990aeee" ON "activity_log" ("teamId", "createdAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_09824687dd642175b00990aeee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fd38eb486cbfb9f8a75b01136"`);
        await queryRunner.query(`CREATE TYPE "public"."activity_log_targettype_enum_old" AS ENUM('ISSUE', 'CALENDAR', 'DOC', 'CHAT', 'PROJECT', 'TEAM')`);
        await queryRunner.query(`ALTER TABLE "activity_log" ALTER COLUMN "targetType" TYPE "public"."activity_log_targettype_enum_old" USING "targetType"::"text"::"public"."activity_log_targettype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."activity_log_targettype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."activity_log_targettype_enum_old" RENAME TO "activity_log_targettype_enum"`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "projectId"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "projectId" uuid`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "teamId"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "teamId" uuid`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "actorId"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "actorId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_2fd38eb486cbfb9f8a75b01136" ON "activity_log" ("createdAt", "projectId") `);
        await queryRunner.query(`DROP INDEX "public"."IDX_81e9616cb4c5c0f18ec277950b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f7a95ae46a8ef4d787808ac14"`);
        await queryRunner.query(`DROP TABLE "mention"`);
        await queryRunner.query(`DROP TYPE "public"."mention_type_enum"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD CONSTRAINT "FK_a1a94d2a4150a9c89e82a37c54d" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD CONSTRAINT "FK_aabf9895f9649b5bea6df2fd97e" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD CONSTRAINT "FK_dfcfb7c2c5086ec721868d85409" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
