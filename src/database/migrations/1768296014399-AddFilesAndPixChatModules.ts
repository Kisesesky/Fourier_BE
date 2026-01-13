import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilesAndPixChatModules1768296014399 implements MigrationInterface {
    name = 'AddFilesAndPixChatModules1768296014399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."file_type_enum" AS ENUM('IMAGE', 'FILE', 'DOCUMENT')`);
        await queryRunner.query(`CREATE TYPE "public"."file_status_enum" AS ENUM('PENDING', 'DONE', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileUrl" character varying NOT NULL, "thumbnailUrl" character varying, "fileName" character varying NOT NULL, "mimeType" character varying NOT NULL, "fileSize" bigint NOT NULL, "type" "public"."file_type_enum" NOT NULL, "status" "public"."file_status_enum" NOT NULL DEFAULT 'PENDING', "errorMessage" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "uploadedById" uuid, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message_reaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "emoji" character varying(32) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "channelMessageId" uuid, "dmMessageId" uuid, CONSTRAINT "PK_20b89d1447ef973e9f10973f220" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fc5c209c759e7b177b32bb781b" ON "message_reaction" ("emoji", "userId", "dmMessageId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d6d83c2b0e27c9bfc692006794" ON "message_reaction" ("emoji", "userId", "channelMessageId") `);
        await queryRunner.query(`CREATE TABLE "message_file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "fileId" uuid, "channelMessageId" uuid, "dmMessageId" uuid, CONSTRAINT "PK_7d21074cf540154ab81a1159372" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "thread_read" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lastReadAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "parentMessageId" uuid, "lastReadMessageId" uuid, CONSTRAINT "PK_73b9b6008a0ef6a0c004d1c0038" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."message_search_scope_enum" AS ENUM('CHANNEL', 'DM')`);
        await queryRunner.query(`CREATE TABLE "message_search" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "messageId" character varying NOT NULL, "scope" "public"."message_search_scope_enum" NOT NULL, "scopeId" character varying NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "senderId" uuid, CONSTRAINT "PK_a136ae997816d7086b10602934f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ff9911717430e1b00590e70ce2" ON "message_search" ("senderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8d5dbf0739bbf5dfa4dbe4e87b" ON "message_search" ("content") `);
        await queryRunner.query(`CREATE INDEX "IDX_f08fa4cc120b2df5ccd46e0918" ON "message_search" ("scope", "scopeId") `);
        await queryRunner.query(`CREATE TYPE "public"."dm_message_type_enum" AS ENUM('TEXT', 'IMAGE', 'FILE', 'DOC', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "type" "public"."dm_message_type_enum" NOT NULL DEFAULT 'TEXT'`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "preview" text`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "editedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "replyCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "lastReplyAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "parentMessageId" uuid`);
        await queryRunner.query(`CREATE TYPE "public"."channel_message_type_enum" AS ENUM('TEXT', 'IMAGE', 'FILE', 'DOC', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "type" "public"."channel_message_type_enum" NOT NULL DEFAULT 'TEXT'`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "preview" text`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "editedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "replyCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "lastReplyAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "parentMessageId" uuid`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "content" text`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "content" text`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('DOC_MENTION', 'DOC_UPDATE', 'ISSUE_ASSIGNED', 'CHAT_MENTION', 'TEAM_INVITE')`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "type" "public"."notification_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file" ADD CONSTRAINT "FK_6d2ab44c0a95eef23d952db9a79" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_reaction" ADD CONSTRAINT "FK_2773f1753769d807ebbd2aa11df" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_reaction" ADD CONSTRAINT "FK_53f8370b76193444876fa9979d9" FOREIGN KEY ("channelMessageId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_reaction" ADD CONSTRAINT "FK_a785b600a3b126d7285269156f7" FOREIGN KEY ("dmMessageId") REFERENCES "dm_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD CONSTRAINT "FK_34c97dda50cd5b46e6197c66483" FOREIGN KEY ("parentMessageId") REFERENCES "dm_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_file" ADD CONSTRAINT "FK_15b2d36767930d7033ce540ea51" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_file" ADD CONSTRAINT "FK_fe503c25f02ca2fc8d1b79c7f9d" FOREIGN KEY ("channelMessageId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_file" ADD CONSTRAINT "FK_c2954e6acf3bba8c3dfe49da08f" FOREIGN KEY ("dmMessageId") REFERENCES "dm_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD CONSTRAINT "FK_28ebb29d1cb38063bbce3770718" FOREIGN KEY ("parentMessageId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "thread_read" ADD CONSTRAINT "FK_5010d739b9e47a6125d5062da35" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "thread_read" ADD CONSTRAINT "FK_7884013b227fabb3da4a10440fa" FOREIGN KEY ("parentMessageId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "thread_read" ADD CONSTRAINT "FK_ab69343c42abbf2d009a1b09d04" FOREIGN KEY ("lastReadMessageId") REFERENCES "channel_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_search" ADD CONSTRAINT "FK_ff9911717430e1b00590e70ce29" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_search" DROP CONSTRAINT "FK_ff9911717430e1b00590e70ce29"`);
        await queryRunner.query(`ALTER TABLE "thread_read" DROP CONSTRAINT "FK_ab69343c42abbf2d009a1b09d04"`);
        await queryRunner.query(`ALTER TABLE "thread_read" DROP CONSTRAINT "FK_7884013b227fabb3da4a10440fa"`);
        await queryRunner.query(`ALTER TABLE "thread_read" DROP CONSTRAINT "FK_5010d739b9e47a6125d5062da35"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP CONSTRAINT "FK_28ebb29d1cb38063bbce3770718"`);
        await queryRunner.query(`ALTER TABLE "message_file" DROP CONSTRAINT "FK_c2954e6acf3bba8c3dfe49da08f"`);
        await queryRunner.query(`ALTER TABLE "message_file" DROP CONSTRAINT "FK_fe503c25f02ca2fc8d1b79c7f9d"`);
        await queryRunner.query(`ALTER TABLE "message_file" DROP CONSTRAINT "FK_15b2d36767930d7033ce540ea51"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP CONSTRAINT "FK_34c97dda50cd5b46e6197c66483"`);
        await queryRunner.query(`ALTER TABLE "message_reaction" DROP CONSTRAINT "FK_a785b600a3b126d7285269156f7"`);
        await queryRunner.query(`ALTER TABLE "message_reaction" DROP CONSTRAINT "FK_53f8370b76193444876fa9979d9"`);
        await queryRunner.query(`ALTER TABLE "message_reaction" DROP CONSTRAINT "FK_2773f1753769d807ebbd2aa11df"`);
        await queryRunner.query(`ALTER TABLE "file" DROP CONSTRAINT "FK_6d2ab44c0a95eef23d952db9a79"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "content" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "content"`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "content" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "parentMessageId"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "lastReplyAt"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "replyCount"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "isDeleted"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "editedAt"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "preview"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."channel_message_type_enum"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "parentMessageId"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "lastReplyAt"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "replyCount"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "isDeleted"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "editedAt"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "preview"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."dm_message_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f08fa4cc120b2df5ccd46e0918"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8d5dbf0739bbf5dfa4dbe4e87b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff9911717430e1b00590e70ce2"`);
        await queryRunner.query(`DROP TABLE "message_search"`);
        await queryRunner.query(`DROP TYPE "public"."message_search_scope_enum"`);
        await queryRunner.query(`DROP TABLE "thread_read"`);
        await queryRunner.query(`DROP TABLE "message_file"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6d83c2b0e27c9bfc692006794"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc5c209c759e7b177b32bb781b"`);
        await queryRunner.query(`DROP TABLE "message_reaction"`);
        await queryRunner.query(`DROP TABLE "file"`);
        await queryRunner.query(`DROP TYPE "public"."file_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."file_type_enum"`);
    }

}
