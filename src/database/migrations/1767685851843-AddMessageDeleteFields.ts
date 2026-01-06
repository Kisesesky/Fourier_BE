import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessageDeleteFields1767685851843 implements MigrationInterface {
    name = 'AddMessageDeleteFields1767685851843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN "isDeleted"`);
    }

}
