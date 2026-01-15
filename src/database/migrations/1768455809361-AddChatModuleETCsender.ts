import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatModuleETCsender1768455809361 implements MigrationInterface {
    name = 'AddChatModuleETCsender1768455809361'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "senderName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "senderAvatar" character varying`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "senderName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "senderAvatar" character varying`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP CONSTRAINT "FK_fc22e557dba0145526253b8e7b9"`);
        await queryRunner.query(`ALTER TABLE "dm_message" ALTER COLUMN "senderId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP CONSTRAINT "FK_4cdc1174bdb04e94b61a92e7078"`);
        await queryRunner.query(`ALTER TABLE "channel_message" ALTER COLUMN "senderId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD CONSTRAINT "FK_fc22e557dba0145526253b8e7b9" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD CONSTRAINT "FK_4cdc1174bdb04e94b61a92e7078" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_message" DROP CONSTRAINT "FK_4cdc1174bdb04e94b61a92e7078"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP CONSTRAINT "FK_fc22e557dba0145526253b8e7b9"`);
        await queryRunner.query(`ALTER TABLE "channel_message" ALTER COLUMN "senderId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD CONSTRAINT "FK_4cdc1174bdb04e94b61a92e7078" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_message" ALTER COLUMN "senderId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD CONSTRAINT "FK_fc22e557dba0145526253b8e7b9" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "senderAvatar"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "senderName"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "senderAvatar"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "senderName"`);
    }

}
