import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatModuleETCsender1768461413852 implements MigrationInterface {
    name = 'AddChatModuleETCsender1768461413852'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dm_message" DROP CONSTRAINT "FK_34c97dda50cd5b46e6197c66483"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP CONSTRAINT "FK_28ebb29d1cb38063bbce3770718"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "replyCount"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "lastReplyAt"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "parentMessageId"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "replyCount"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "lastReplyAt"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "parentMessageId"`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "threadCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "lastThreadAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "threadParentId" uuid`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "threadCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "lastThreadAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "threadParentId" uuid`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD CONSTRAINT "FK_897a263e74e1f7c7f033008c60c" FOREIGN KEY ("threadParentId") REFERENCES "dm_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD CONSTRAINT "FK_7bd192a69c24e9e8cc236e03a80" FOREIGN KEY ("threadParentId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_message" DROP CONSTRAINT "FK_7bd192a69c24e9e8cc236e03a80"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP CONSTRAINT "FK_897a263e74e1f7c7f033008c60c"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "threadParentId"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "lastThreadAt"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "threadCount"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "threadParentId"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "lastThreadAt"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "threadCount"`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "parentMessageId" uuid`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "lastReplyAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "replyCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "parentMessageId" uuid`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "lastReplyAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "replyCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD CONSTRAINT "FK_28ebb29d1cb38063bbce3770718" FOREIGN KEY ("parentMessageId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD CONSTRAINT "FK_34c97dda50cd5b46e6197c66483" FOREIGN KEY ("parentMessageId") REFERENCES "dm_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
