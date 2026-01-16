import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalendarCategoryModule1768546684947 implements MigrationInterface {
    name = 'AddCalendarCategoryModule1768546684947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event" RENAME COLUMN "category" TO "categoryId"`);
        await queryRunner.query(`ALTER TYPE "public"."calendar_event_category_enum" RENAME TO "calendar_event_categoryid_enum"`);
        await queryRunner.query(`CREATE TABLE "calendar_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "color" character varying NOT NULL DEFAULT '#3788d8', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" uuid, CONSTRAINT "PK_aa0dae18edce6acbda029c94476" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "categoryId"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD "categoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "calendar_category" ADD CONSTRAINT "FK_cd85c85ff8dc3f897ba12df7db9" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "FK_fbbecb6aa5ee4342dcdf22819e5" FOREIGN KEY ("categoryId") REFERENCES "calendar_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "FK_fbbecb6aa5ee4342dcdf22819e5"`);
        await queryRunner.query(`ALTER TABLE "calendar_category" DROP CONSTRAINT "FK_cd85c85ff8dc3f897ba12df7db9"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "categoryId"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD "categoryId" "public"."calendar_event_categoryid_enum" NOT NULL DEFAULT 'PERSONAL'`);
        await queryRunner.query(`DROP TABLE "calendar_category"`);
        await queryRunner.query(`ALTER TYPE "public"."calendar_event_categoryid_enum" RENAME TO "calendar_event_category_enum"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" RENAME COLUMN "categoryId" TO "category"`);
    }

}
