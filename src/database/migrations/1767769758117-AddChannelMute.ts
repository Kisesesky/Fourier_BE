import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChannelMute1767769758117 implements MigrationInterface {
    name = 'AddChannelMute1767769758117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_member" ADD "isMuted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD "mutedUntil" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_member" DROP COLUMN "mutedUntil"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP COLUMN "isMuted"`);
    }

}
