import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChannelWsChatEntity1767763318352 implements MigrationInterface {
    name = 'AddChannelWsChatEntity1767763318352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workspace_member_role_enum" AS ENUM('owner', 'admin', 'member')`);
        await queryRunner.query(`CREATE TABLE "workspace_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."workspace_member_role_enum" NOT NULL DEFAULT 'member', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "workspaceId" uuid, CONSTRAINT "UQ_b4104c0c92e2afdca1127be4456" UNIQUE ("userId", "workspaceId"), CONSTRAINT "PK_a3a35f64bf30517010551467c6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "channel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isPrivate" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "workspaceId" uuid, CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workspace" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "iconUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ca86b6f9b3be5fe26d307d09b49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "channel_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" character varying NOT NULL, "isDeleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "channelId" uuid, "senderId" uuid, CONSTRAINT "PK_b01cf5d92374acdd654bcb61df7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."channel_member_role_enum" AS ENUM('owner', 'member')`);
        await queryRunner.query(`CREATE TABLE "channel_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."channel_member_role_enum" NOT NULL DEFAULT 'member', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "lastReadAt" TIMESTAMP WITH TIME ZONE, "channelId" uuid, "userId" uuid, CONSTRAINT "UQ_f6fbde8772b051e6ef433f890cd" UNIQUE ("channelId", "userId"), CONSTRAINT "PK_a4a716289e5b0468f55f8e8d225" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_03ce416ae83c188274dec61205c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_15b622cbfffabc30d7dbc52fede" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel" ADD CONSTRAINT "FK_885f1a3a3369b4cfa36bfd2e83f" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD CONSTRAINT "FK_67e2cdb305529e00e7abfff8d77" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD CONSTRAINT "FK_4cdc1174bdb04e94b61a92e7078" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_245da03cfde01c653c492d83a0d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_245da03cfde01c653c492d83a0d"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP CONSTRAINT "FK_4cdc1174bdb04e94b61a92e7078"`);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP CONSTRAINT "FK_67e2cdb305529e00e7abfff8d77"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP CONSTRAINT "FK_885f1a3a3369b4cfa36bfd2e83f"`);
        await queryRunner.query(`ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_15b622cbfffabc30d7dbc52fede"`);
        await queryRunner.query(`ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_03ce416ae83c188274dec61205c"`);
        await queryRunner.query(`DROP TABLE "channel_member"`);
        await queryRunner.query(`DROP TYPE "public"."channel_member_role_enum"`);
        await queryRunner.query(`DROP TABLE "channel_message"`);
        await queryRunner.query(`DROP TABLE "workspace"`);
        await queryRunner.query(`DROP TABLE "channel"`);
        await queryRunner.query(`DROP TABLE "workspace_member"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_member_role_enum"`);
    }

}
