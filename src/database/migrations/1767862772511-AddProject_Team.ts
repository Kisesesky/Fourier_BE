import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectTeam1767862772511 implements MigrationInterface {
    name = 'AddProjectTeam1767862772511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel" DROP CONSTRAINT "FK_885f1a3a3369b4cfa36bfd2e83f"`);
        await queryRunner.query(`ALTER TABLE "workspace" RENAME COLUMN "iconUrl" TO "createdById"`);
        await queryRunner.query(`CREATE TYPE "public"."team_member_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`CREATE TABLE "team_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."team_member_role_enum" NOT NULL DEFAULT 'MEMBER', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "teamId" uuid, "userId" uuid, CONSTRAINT "UQ_bd2b3ef7569d75642e091853771" UNIQUE ("teamId", "userId"), CONSTRAINT "PK_649680684d72a20d279641469c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."project_member_role_enum" AS ENUM('OWNER', 'MAINTAINER', 'MEMBER', 'VIEWER')`);
        await queryRunner.query(`CREATE TABLE "project_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."project_member_role_enum" NOT NULL DEFAULT 'MEMBER', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" uuid, "userId" uuid, CONSTRAINT "UQ_1f95533c37d5a7215c796d6ac9f" UNIQUE ("projectId", "userId"), CONSTRAINT "PK_64dba8e9dcf96ce383cfd19d6fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."calendar_event_category_enum" AS ENUM('PERSONAL', 'TEAM')`);
        await queryRunner.query(`CREATE TABLE "calendar_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "category" "public"."calendar_event_category_enum" NOT NULL DEFAULT 'PERSONAL', "startAt" TIMESTAMP NOT NULL, "endAt" TIMESTAMP NOT NULL, "location" character varying, "memo" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" uuid, "createdById" uuid, CONSTRAINT "PK_176fe24e6eb48c3fef696c7641f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."project_icontype_enum" AS ENUM('EMOJI', 'IMAGE')`);
        await queryRunner.query(`CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "iconType" "public"."project_icontype_enum" NOT NULL DEFAULT 'EMOJI', "iconValue" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "teamId" uuid, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."team_icontype_enum" AS ENUM('EMOJI', 'IMAGE')`);
        await queryRunner.query(`CREATE TABLE "team" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "iconType" "public"."team_icontype_enum" NOT NULL DEFAULT 'EMOJI', "iconValue" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "workspaceId" uuid, CONSTRAINT "PK_f57d8293406df4af348402e4b74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."team_invite_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "team_invite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."team_invite_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "teamId" uuid, "inviterId" uuid, "inviteeId" uuid, CONSTRAINT "UQ_2d025fed74285a88313f6eaba8a" UNIQUE ("teamId", "inviteeId"), CONSTRAINT "PK_deb3080b1edfad7d043d6db876e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dm_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "roomId" uuid, "senderId" uuid, CONSTRAINT "PK_a48eb39c900efefb12269aa0625" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dm_room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4547b49bc2e882df1bf01c2bd56" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "channel_message_read_by_user" ("channelMessageId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_05461a1932db2dce17d0b712fd1" PRIMARY KEY ("channelMessageId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_565d144c31dd7e9619a4b2bb5e" ON "channel_message_read_by_user" ("channelMessageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ddafd2b48f7beefea98f788ff7" ON "channel_message_read_by_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "dm_message_read_by_user" ("dmMessageId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_de034b901edba5bd580f0030227" PRIMARY KEY ("dmMessageId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_65214e1727d123bf0db4eb8f73" ON "dm_message_read_by_user" ("dmMessageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_de7b509265e4ef9aa703f0065b" ON "dm_message_read_by_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "dm_room_participants_user" ("dmRoomId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_8f3cdfd6bd11467741d65215166" PRIMARY KEY ("dmRoomId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_592ee4c57b37864610502ffc2d" ON "dm_room_participants_user" ("dmRoomId") `);
        await queryRunner.query(`CREATE INDEX "IDX_63e3883eef86eb274320ecd623" ON "dm_room_participants_user" ("userId") `);
        await queryRunner.query(`ALTER TABLE "channel_message" DROP COLUMN "isDeleted"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "isPrivate"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "workspaceId"`);
        await queryRunner.query(`ALTER TABLE "channel" ADD "projectId" uuid`);
        await queryRunner.query(`ALTER TABLE "workspace" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "workspace" ADD "createdById" uuid`);
        await queryRunner.query(`ALTER TABLE "team_member" ADD CONSTRAINT "FK_74da8f612921485e1005dc8e225" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_member" ADD CONSTRAINT "FK_d2be3e8fc9ab0f69673721c7fc3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_member" ADD CONSTRAINT "FK_7115f82a61e31ac95b2681d83e4" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_member" ADD CONSTRAINT "FK_e7520163dafa7c1104fd672caad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "FK_f07474eea378c87aeeb0bd208c5" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "FK_2e1e461405c8aad4010c8e71ab9" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel" ADD CONSTRAINT "FK_68b675d87a488bc6fafc962636f" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_d0474b642dc0ae63660dd8e2ac0" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team" ADD CONSTRAINT "FK_66f4adf2b7982a24c835d60e399" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace" ADD CONSTRAINT "FK_fb730da36fb79e21e8fa5f2c303" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_invite" ADD CONSTRAINT "FK_dec64033827ee287d0863a1b180" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_invite" ADD CONSTRAINT "FK_312e8f5221992955c611192ff09" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_invite" ADD CONSTRAINT "FK_d25e89b12f60e1c60f93fd8229d" FOREIGN KEY ("inviteeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD CONSTRAINT "FK_a2365cffdcc1918bce03e46a3c4" FOREIGN KEY ("roomId") REFERENCES "dm_room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_message" ADD CONSTRAINT "FK_fc22e557dba0145526253b8e7b9" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_message_read_by_user" ADD CONSTRAINT "FK_565d144c31dd7e9619a4b2bb5e2" FOREIGN KEY ("channelMessageId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "channel_message_read_by_user" ADD CONSTRAINT "FK_ddafd2b48f7beefea98f788ff73" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "dm_message_read_by_user" ADD CONSTRAINT "FK_65214e1727d123bf0db4eb8f736" FOREIGN KEY ("dmMessageId") REFERENCES "dm_message"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "dm_message_read_by_user" ADD CONSTRAINT "FK_de7b509265e4ef9aa703f0065b4" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "dm_room_participants_user" ADD CONSTRAINT "FK_592ee4c57b37864610502ffc2dd" FOREIGN KEY ("dmRoomId") REFERENCES "dm_room"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "dm_room_participants_user" ADD CONSTRAINT "FK_63e3883eef86eb274320ecd6235" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dm_room_participants_user" DROP CONSTRAINT "FK_63e3883eef86eb274320ecd6235"`);
        await queryRunner.query(`ALTER TABLE "dm_room_participants_user" DROP CONSTRAINT "FK_592ee4c57b37864610502ffc2dd"`);
        await queryRunner.query(`ALTER TABLE "dm_message_read_by_user" DROP CONSTRAINT "FK_de7b509265e4ef9aa703f0065b4"`);
        await queryRunner.query(`ALTER TABLE "dm_message_read_by_user" DROP CONSTRAINT "FK_65214e1727d123bf0db4eb8f736"`);
        await queryRunner.query(`ALTER TABLE "channel_message_read_by_user" DROP CONSTRAINT "FK_ddafd2b48f7beefea98f788ff73"`);
        await queryRunner.query(`ALTER TABLE "channel_message_read_by_user" DROP CONSTRAINT "FK_565d144c31dd7e9619a4b2bb5e2"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP CONSTRAINT "FK_fc22e557dba0145526253b8e7b9"`);
        await queryRunner.query(`ALTER TABLE "dm_message" DROP CONSTRAINT "FK_a2365cffdcc1918bce03e46a3c4"`);
        await queryRunner.query(`ALTER TABLE "team_invite" DROP CONSTRAINT "FK_d25e89b12f60e1c60f93fd8229d"`);
        await queryRunner.query(`ALTER TABLE "team_invite" DROP CONSTRAINT "FK_312e8f5221992955c611192ff09"`);
        await queryRunner.query(`ALTER TABLE "team_invite" DROP CONSTRAINT "FK_dec64033827ee287d0863a1b180"`);
        await queryRunner.query(`ALTER TABLE "workspace" DROP CONSTRAINT "FK_fb730da36fb79e21e8fa5f2c303"`);
        await queryRunner.query(`ALTER TABLE "team" DROP CONSTRAINT "FK_66f4adf2b7982a24c835d60e399"`);
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_d0474b642dc0ae63660dd8e2ac0"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP CONSTRAINT "FK_68b675d87a488bc6fafc962636f"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "FK_2e1e461405c8aad4010c8e71ab9"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "FK_f07474eea378c87aeeb0bd208c5"`);
        await queryRunner.query(`ALTER TABLE "project_member" DROP CONSTRAINT "FK_e7520163dafa7c1104fd672caad"`);
        await queryRunner.query(`ALTER TABLE "project_member" DROP CONSTRAINT "FK_7115f82a61e31ac95b2681d83e4"`);
        await queryRunner.query(`ALTER TABLE "team_member" DROP CONSTRAINT "FK_d2be3e8fc9ab0f69673721c7fc3"`);
        await queryRunner.query(`ALTER TABLE "team_member" DROP CONSTRAINT "FK_74da8f612921485e1005dc8e225"`);
        await queryRunner.query(`ALTER TABLE "workspace" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "workspace" ADD "createdById" character varying`);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "projectId"`);
        await queryRunner.query(`ALTER TABLE "channel" ADD "workspaceId" uuid`);
        await queryRunner.query(`ALTER TABLE "channel" ADD "isPrivate" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "channel_message" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63e3883eef86eb274320ecd623"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_592ee4c57b37864610502ffc2d"`);
        await queryRunner.query(`DROP TABLE "dm_room_participants_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de7b509265e4ef9aa703f0065b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_65214e1727d123bf0db4eb8f73"`);
        await queryRunner.query(`DROP TABLE "dm_message_read_by_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ddafd2b48f7beefea98f788ff7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_565d144c31dd7e9619a4b2bb5e"`);
        await queryRunner.query(`DROP TABLE "channel_message_read_by_user"`);
        await queryRunner.query(`DROP TABLE "dm_room"`);
        await queryRunner.query(`DROP TABLE "dm_message"`);
        await queryRunner.query(`DROP TABLE "team_invite"`);
        await queryRunner.query(`DROP TYPE "public"."team_invite_status_enum"`);
        await queryRunner.query(`DROP TABLE "team"`);
        await queryRunner.query(`DROP TYPE "public"."team_icontype_enum"`);
        await queryRunner.query(`DROP TABLE "project"`);
        await queryRunner.query(`DROP TYPE "public"."project_icontype_enum"`);
        await queryRunner.query(`DROP TABLE "calendar_event"`);
        await queryRunner.query(`DROP TYPE "public"."calendar_event_category_enum"`);
        await queryRunner.query(`DROP TABLE "project_member"`);
        await queryRunner.query(`DROP TYPE "public"."project_member_role_enum"`);
        await queryRunner.query(`DROP TABLE "team_member"`);
        await queryRunner.query(`DROP TYPE "public"."team_member_role_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace" RENAME COLUMN "createdById" TO "iconUrl"`);
        await queryRunner.query(`ALTER TABLE "channel" ADD CONSTRAINT "FK_885f1a3a3369b4cfa36bfd2e83f" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
