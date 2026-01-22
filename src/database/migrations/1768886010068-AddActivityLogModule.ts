import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActivityLogModule1768886010068 implements MigrationInterface {
    name = 'AddActivityLogModule1768886010068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."activity_log_targettype_enum" AS ENUM('ISSUE', 'CALENDAR', 'DOC', 'CHAT', 'PROJECT', 'TEAM')`);
        await queryRunner.query(`CREATE TABLE "activity_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "targetType" "public"."activity_log_targettype_enum" NOT NULL, "targetId" character varying NOT NULL, "action" character varying NOT NULL, "payload" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "actorId" uuid, "projectId" uuid, "teamId" uuid, CONSTRAINT "PK_067d761e2956b77b14e534fd6f1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2fd38eb486cbfb9f8a75b01136" ON "activity_log" ("projectId", "createdAt") `);
        await queryRunner.query(`ALTER TYPE "public"."issue_status_enum" RENAME TO "issue_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."issue_status_enum" AS ENUM('PLANNED', 'IN_PROGRESS', 'WARNING', 'DELAYED', 'DONE', 'REVIEW')`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "status" TYPE "public"."issue_status_enum" USING "status"::"text"::"public"."issue_status_enum"`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "status" SET DEFAULT 'PLANNED'`);
        await queryRunner.query(`DROP TYPE "public"."issue_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_2baaa732b13e60821a674ad8d9" ON "calendar_event" ("linkedIssueId") `);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD CONSTRAINT "FK_dfcfb7c2c5086ec721868d85409" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD CONSTRAINT "FK_aabf9895f9649b5bea6df2fd97e" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD CONSTRAINT "FK_a1a94d2a4150a9c89e82a37c54d" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_log" DROP CONSTRAINT "FK_a1a94d2a4150a9c89e82a37c54d"`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP CONSTRAINT "FK_aabf9895f9649b5bea6df2fd97e"`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP CONSTRAINT "FK_dfcfb7c2c5086ec721868d85409"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2baaa732b13e60821a674ad8d9"`);
        await queryRunner.query(`CREATE TYPE "public"."issue_status_enum_old" AS ENUM('PLANNED', 'IN_PROGRESS', 'WARNING', 'DELAYED', 'DONE')`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "status" TYPE "public"."issue_status_enum_old" USING "status"::"text"::"public"."issue_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "issue" ALTER COLUMN "status" SET DEFAULT 'PLANNED'`);
        await queryRunner.query(`DROP TYPE "public"."issue_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."issue_status_enum_old" RENAME TO "issue_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fd38eb486cbfb9f8a75b01136"`);
        await queryRunner.query(`DROP TABLE "activity_log"`);
        await queryRunner.query(`DROP TYPE "public"."activity_log_targettype_enum"`);
    }

}
