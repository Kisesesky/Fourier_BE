import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatModulePlus1768382079852 implements MigrationInterface {
    name = 'AddChatModulePlus1768382079852'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_245da03cfde01c653c492d83a0d"`);
        await queryRunner.query(`ALTER TABLE "thread_read" DROP CONSTRAINT "FK_ab69343c42abbf2d009a1b09d04"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "UQ_f6fbde8772b051e6ef433f890cd"`);
        await queryRunner.query(`CREATE TABLE "link_preview" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "title" character varying, "description" character varying, "imageUrl" character varying, "siteName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "channelMessageId" uuid, "dmMessageId" uuid, CONSTRAINT "REL_6b65ed19d4550c6aeaecb639c4" UNIQUE ("channelMessageId"), CONSTRAINT "REL_ad146951948a8d9fe7d29fdc8a" UNIQUE ("dmMessageId"), CONSTRAINT "PK_54f44ab052ce8248299de8d8de9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dce64a7821e5e77cf61bab6ec4" ON "link_preview" ("url") `);
        await queryRunner.query(`CREATE TABLE "saved_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "savedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "channelMessageId" uuid, "dmMessageId" uuid, CONSTRAINT "UQ_12e13c6069277750e4ed088f1cc" UNIQUE ("userId", "dmMessageId"), CONSTRAINT "UQ_f657042a71d2eee4413d8beb6ad" UNIQUE ("userId", "channelMessageId"), CONSTRAINT "PK_616e55606a03c061c812a19dda0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dm_read" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lastReadAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" uuid, "roomId" uuid, CONSTRAINT "UQ_985ec1aa657e9e42b94e613ca6c" UNIQUE ("userId", "roomId"), CONSTRAINT "PK_45fb367954a396b7371b3fcdcba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "channel_read" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lastReadAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" uuid, "channelId" uuid, CONSTRAINT "UQ_db76b4ed07c3e2b243fe46aa7fa" UNIQUE ("userId", "channelId"), CONSTRAINT "PK_ea4d2215f2c5342c82d3c8c22e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "channel_pinned_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pinnedAt" TIMESTAMP NOT NULL DEFAULT now(), "channelId" uuid, "messageId" uuid, "pinnedById" uuid, CONSTRAINT "UQ_cf249c0ae2bfc19eda4e8ea9f22" UNIQUE ("channelId", "messageId"), CONSTRAINT "PK_66176a8b0b03ca2dafe5a962b37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."channel_member_role_enum"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP COLUMN "joinedAt"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP COLUMN "lastReadAt"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP COLUMN "isMuted"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP COLUMN "mutedUntil"`);
        await queryRunner.query(`ALTER TABLE "thread_read" DROP COLUMN "lastReadMessageId"`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD "replyToId" uuid`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "replyToId" uuid`);
        await queryRunner.query(`ALTER TABLE "channel" ADD "isDefault" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "link_preview" ADD CONSTRAINT "FK_6b65ed19d4550c6aeaecb639c49" FOREIGN KEY ("channelMessageId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "link_preview" ADD CONSTRAINT "FK_ad146951948a8d9fe7d29fdc8a7" FOREIGN KEY ("dmMessageId") REFERENCES "dm_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD CONSTRAINT "FK_7e86336e211608b421063a4e51c" FOREIGN KEY ("replyToId") REFERENCES "dm_message"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD CONSTRAINT "FK_5547f2eb9327456bc235117c902" FOREIGN KEY ("replyToId") REFERENCES "channel_message"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_245da03cfde01c653c492d83a0d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_message" ADD CONSTRAINT "FK_3d970037ac2d589310bc27b3008" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_message" ADD CONSTRAINT "FK_367363bdeff8bc76d4ef80e3f74" FOREIGN KEY ("channelMessageId") REFERENCES "channel_message"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_message" ADD CONSTRAINT "FK_88866917dec66b61212e0817981" FOREIGN KEY ("dmMessageId") REFERENCES "dm_message"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_read" ADD CONSTRAINT "FK_c64071a5ae02daf343187efc0a8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_read" ADD CONSTRAINT "FK_e243a4bef142e18d2702bd631b0" FOREIGN KEY ("roomId") REFERENCES "dm_room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_read" ADD CONSTRAINT "FK_b6d97cc981fb37cf50cc2aa56c6" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_read" ADD CONSTRAINT "FK_5a604163331584f207c12bb03f3" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_pinned_message" ADD CONSTRAINT "FK_204050629908813e0cef8c33c7b" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_pinned_message" ADD CONSTRAINT "FK_b2926681c630e7e3ba52aeb9aaf" FOREIGN KEY ("messageId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_pinned_message" ADD CONSTRAINT "FK_6aede0b78bf9ee146e11df3dc2c" FOREIGN KEY ("pinnedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_pinned_message" DROP CONSTRAINT "FK_6aede0b78bf9ee146e11df3dc2c"`);
        await queryRunner.query(`ALTER TABLE "channel_pinned_message" DROP CONSTRAINT "FK_b2926681c630e7e3ba52aeb9aaf"`);
        await queryRunner.query(`ALTER TABLE "channel_pinned_message" DROP CONSTRAINT "FK_204050629908813e0cef8c33c7b"`);
        await queryRunner.query(`ALTER TABLE "channel_read" DROP CONSTRAINT "FK_5a604163331584f207c12bb03f3"`);
        await queryRunner.query(`ALTER TABLE "channel_read" DROP CONSTRAINT "FK_b6d97cc981fb37cf50cc2aa56c6"`);
        await queryRunner.query(`ALTER TABLE "dm_read" DROP CONSTRAINT "FK_e243a4bef142e18d2702bd631b0"`);
        await queryRunner.query(`ALTER TABLE "dm_read" DROP CONSTRAINT "FK_c64071a5ae02daf343187efc0a8"`);
        await queryRunner.query(`ALTER TABLE "saved_message" DROP CONSTRAINT "FK_88866917dec66b61212e0817981"`);
        await queryRunner.query(`ALTER TABLE "saved_message" DROP CONSTRAINT "FK_367363bdeff8bc76d4ef80e3f74"`);
        await queryRunner.query(`ALTER TABLE "saved_message" DROP CONSTRAINT "FK_3d970037ac2d589310bc27b3008"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_245da03cfde01c653c492d83a0d"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP CONSTRAINT "FK_5547f2eb9327456bc235117c902"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP CONSTRAINT "FK_7e86336e211608b421063a4e51c"`);
        await queryRunner.query(`ALTER TABLE "link_preview" DROP CONSTRAINT "FK_ad146951948a8d9fe7d29fdc8a7"`);
        await queryRunner.query(`ALTER TABLE "link_preview" DROP CONSTRAINT "FK_6b65ed19d4550c6aeaecb639c49"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "isDefault"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "replyToId"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP COLUMN "replyToId"`);
        await queryRunner.query(`ALTER TABLE "thread_read" ADD "lastReadMessageId" uuid`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD "mutedUntil" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD "isMuted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD "lastReadAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD "joinedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE TYPE "public"."channel_member_role_enum" AS ENUM('owner', 'member')`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD "role" "public"."channel_member_role_enum" NOT NULL DEFAULT 'member'`);
        await queryRunner.query(`DROP TABLE "channel_pinned_message"`);
        await queryRunner.query(`DROP TABLE "channel_read"`);
        await queryRunner.query(`DROP TABLE "dm_read"`);
        await queryRunner.query(`DROP TABLE "saved_message"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dce64a7821e5e77cf61bab6ec4"`);
        await queryRunner.query(`DROP TABLE "link_preview"`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "UQ_f6fbde8772b051e6ef433f890cd" UNIQUE ("channelId", "userId")`);
        await queryRunner.query(`ALTER TABLE "thread_read" ADD CONSTRAINT "FK_ab69343c42abbf2d009a1b09d04" FOREIGN KEY ("lastReadMessageId") REFERENCES "channel_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_245da03cfde01c653c492d83a0d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
