import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCalendarIssueModule1768554043167 implements MigrationInterface {
    name = 'FixCalendarIssueModule1768554043167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD "linkedIssueId" character varying`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD "sourceType" character varying NOT NULL DEFAULT 'manual'`);
        await queryRunner.query(`ALTER TABLE "issue" ADD "dueAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "issue" ADD "calendarEventId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "calendarEventId"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP COLUMN "dueAt"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "sourceType"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "linkedIssueId"`);
    }

}
