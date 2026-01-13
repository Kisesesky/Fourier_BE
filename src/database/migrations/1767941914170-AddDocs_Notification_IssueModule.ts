import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocsNotificationIssueModule1767941914170 implements MigrationInterface {
    name = 'AddDocsNotificationIssueModule1767941914170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "issue_comment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "issueId" uuid, "authorId" uuid, CONSTRAINT "PK_2ad05784e2ae661fa409e5e0248" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."issue_status_enum" AS ENUM('PLANNED', 'IN_PROGRESS', 'WARNING', 'DELAYED', 'DONE')`);
        await queryRunner.query(`CREATE TABLE "issue" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "status" "public"."issue_status_enum" NOT NULL DEFAULT 'PLANNED', "progress" integer NOT NULL DEFAULT '0', "startAt" date, "endAt" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "assigneeId" uuid, "creatorId" uuid, "projectId" uuid, "parentId" uuid, CONSTRAINT "PK_f80e086c249b9f3f3ff2fd321b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "payload" jsonb NOT NULL, "read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "document_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "documentId" uuid, "editorId" uuid, CONSTRAINT "PK_a4c39c95456c5dbb2e96cca713c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "document_cursor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "documentId" uuid, "userId" uuid, CONSTRAINT "PK_7007fcb1c62fdffcdc6842aee8f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."document_member_permission_enum" AS ENUM('READ', 'WRITE', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "document_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "permission" "public"."document_member_permission_enum" NOT NULL, "documentId" uuid, "userId" uuid, CONSTRAINT "UQ_2fcf1f694a98857588063a15eb9" UNIQUE ("documentId", "userId"), CONSTRAINT "PK_9b884daffb4a5c4ab3f5f466cc0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "content" text, "searchVector" tsvector NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "folderId" uuid, "authorId" uuid, CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."folder_member_permission_enum" AS ENUM('READ', 'WRITE', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "folder_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "permission" "public"."folder_member_permission_enum" NOT NULL, "folderId" uuid, "userId" uuid, CONSTRAINT "UQ_fc8c3b211a744c1f7fc6ed83879" UNIQUE ("folderId", "userId"), CONSTRAINT "PK_2c10d147b607dc3021b81dd31c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "folder" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "parentId" uuid, CONSTRAINT "PK_6278a41a706740c94c02e288df8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "issue_comment" ADD CONSTRAINT "FK_180710fead1c94ca499c57a7d42" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue_comment" ADD CONSTRAINT "FK_d24944b58b33758f322202b07da" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_d92e4c455673ad050d998bb2c56" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_c45ed95b87402ee9e4b3c8dc81f" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_be30b91466b730c5e25f1181f79" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue" ADD CONSTRAINT "FK_5b80b4f6d142f063d4a948155b0" FOREIGN KEY ("parentId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document_version" ADD CONSTRAINT "FK_798ac949e0d25e76695ffc7776a" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document_version" ADD CONSTRAINT "FK_242b31a00183e40a2e73eeb23db" FOREIGN KEY ("editorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document_cursor" ADD CONSTRAINT "FK_1457fdc5fc28b0022f7c2dfb847" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document_cursor" ADD CONSTRAINT "FK_e72fe05dfdee9d626e9706a183b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document_member" ADD CONSTRAINT "FK_084b9940722e25c4b3a5300e957" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document_member" ADD CONSTRAINT "FK_5486d4d5cb93ad2de9cb2ebe42f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_76b187510eda9c862f9944808a8" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_6a2eb13cadfc503989cbe367572" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "folder_member" ADD CONSTRAINT "FK_e09cd2a0b6ffba79aae13b55998" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "folder_member" ADD CONSTRAINT "FK_036333171b8af8633d9179d4d3d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "folder" ADD CONSTRAINT "FK_9ee3bd0f189fb242d488c0dfa39" FOREIGN KEY ("parentId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_9ee3bd0f189fb242d488c0dfa39"`);
        await queryRunner.query(`ALTER TABLE "folder_member" DROP CONSTRAINT "FK_036333171b8af8633d9179d4d3d"`);
        await queryRunner.query(`ALTER TABLE "folder_member" DROP CONSTRAINT "FK_e09cd2a0b6ffba79aae13b55998"`);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_6a2eb13cadfc503989cbe367572"`);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_76b187510eda9c862f9944808a8"`);
        await queryRunner.query(`ALTER TABLE "document_member" DROP CONSTRAINT "FK_5486d4d5cb93ad2de9cb2ebe42f"`);
        await queryRunner.query(`ALTER TABLE "document_member" DROP CONSTRAINT "FK_084b9940722e25c4b3a5300e957"`);
        await queryRunner.query(`ALTER TABLE "document_cursor" DROP CONSTRAINT "FK_e72fe05dfdee9d626e9706a183b"`);
        await queryRunner.query(`ALTER TABLE "document_cursor" DROP CONSTRAINT "FK_1457fdc5fc28b0022f7c2dfb847"`);
        await queryRunner.query(`ALTER TABLE "document_version" DROP CONSTRAINT "FK_242b31a00183e40a2e73eeb23db"`);
        await queryRunner.query(`ALTER TABLE "document_version" DROP CONSTRAINT "FK_798ac949e0d25e76695ffc7776a"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_5b80b4f6d142f063d4a948155b0"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_be30b91466b730c5e25f1181f79"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_c45ed95b87402ee9e4b3c8dc81f"`);
        await queryRunner.query(`ALTER TABLE "issue" DROP CONSTRAINT "FK_d92e4c455673ad050d998bb2c56"`);
        await queryRunner.query(`ALTER TABLE "issue_comment" DROP CONSTRAINT "FK_d24944b58b33758f322202b07da"`);
        await queryRunner.query(`ALTER TABLE "issue_comment" DROP CONSTRAINT "FK_180710fead1c94ca499c57a7d42"`);
        await queryRunner.query(`DROP TABLE "folder"`);
        await queryRunner.query(`DROP TABLE "folder_member"`);
        await queryRunner.query(`DROP TYPE "public"."folder_member_permission_enum"`);
        await queryRunner.query(`DROP TABLE "document"`);
        await queryRunner.query(`DROP TABLE "document_member"`);
        await queryRunner.query(`DROP TYPE "public"."document_member_permission_enum"`);
        await queryRunner.query(`DROP TABLE "document_cursor"`);
        await queryRunner.query(`DROP TABLE "document_version"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "issue"`);
        await queryRunner.query(`DROP TYPE "public"."issue_status_enum"`);
        await queryRunner.query(`DROP TABLE "issue_comment"`);
    }

}
