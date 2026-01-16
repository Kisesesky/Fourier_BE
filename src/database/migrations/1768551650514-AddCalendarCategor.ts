import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalendarCategor1768551650514 implements MigrationInterface {
    name = 'AddCalendarCategor1768551650514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_category" ADD "isDefault" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_category" DROP COLUMN "isDefault"`);
    }

}
