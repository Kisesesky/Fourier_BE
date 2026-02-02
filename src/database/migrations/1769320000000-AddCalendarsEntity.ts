import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCalendarsEntity1769320000000 implements MigrationInterface {
  name = 'AddCalendarsEntity1769320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."calendar_type_enum" AS ENUM('TEAM', 'PERSONAL', 'PRIVATE')`);
    await queryRunner.query(`
      CREATE TABLE "calendar" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "type" "public"."calendar_type_enum" NOT NULL DEFAULT 'TEAM',
        "color" character varying NOT NULL DEFAULT '#3b82f6',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "projectId" uuid,
        "ownerId" uuid,
        CONSTRAINT "PK_calendar_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_calendar_project" ON "calendar" ("projectId")`);
    await queryRunner.query(`
      ALTER TABLE "calendar"
      ADD CONSTRAINT "FK_calendar_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "calendar"
      ADD CONSTRAINT "FK_calendar_owner" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`CREATE TYPE "public"."calendar_member_role_enum" AS ENUM('OWNER', 'MEMBER')`);
    await queryRunner.query(`
      CREATE TABLE "calendar_member" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" "public"."calendar_member_role_enum" NOT NULL DEFAULT 'MEMBER',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "calendarId" uuid,
        "userId" uuid,
        CONSTRAINT "PK_calendar_member_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_calendar_member_calendar" ON "calendar_member" ("calendarId")`);
    await queryRunner.query(`
      ALTER TABLE "calendar_member"
      ADD CONSTRAINT "FK_calendar_member_calendar" FOREIGN KEY ("calendarId") REFERENCES "calendar"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "calendar_member"
      ADD CONSTRAINT "FK_calendar_member_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`ALTER TABLE "calendar_category" ADD "calendarId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "calendar_category"
      ADD CONSTRAINT "FK_calendar_category_calendar" FOREIGN KEY ("calendarId") REFERENCES "calendar"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`ALTER TABLE "calendar_event" ADD "calendarId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "calendar_event"
      ADD CONSTRAINT "FK_calendar_event_calendar" FOREIGN KEY ("calendarId") REFERENCES "calendar"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "FK_calendar_event_calendar"`);
    await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "calendarId"`);
    await queryRunner.query(`ALTER TABLE "calendar_category" DROP CONSTRAINT "FK_calendar_category_calendar"`);
    await queryRunner.query(`ALTER TABLE "calendar_category" DROP COLUMN "calendarId"`);
    await queryRunner.query(`ALTER TABLE "calendar_member" DROP CONSTRAINT "FK_calendar_member_user"`);
    await queryRunner.query(`ALTER TABLE "calendar_member" DROP CONSTRAINT "FK_calendar_member_calendar"`);
    await queryRunner.query(`DROP INDEX "IDX_calendar_member_calendar"`);
    await queryRunner.query(`DROP TABLE "calendar_member"`);
    await queryRunner.query(`DROP TYPE "public"."calendar_member_role_enum"`);
    await queryRunner.query(`ALTER TABLE "calendar" DROP CONSTRAINT "FK_calendar_owner"`);
    await queryRunner.query(`ALTER TABLE "calendar" DROP CONSTRAINT "FK_calendar_project"`);
    await queryRunner.query(`DROP INDEX "IDX_calendar_project"`);
    await queryRunner.query(`DROP TABLE "calendar"`);
    await queryRunner.query(`DROP TYPE "public"."calendar_type_enum"`);
  }
}
