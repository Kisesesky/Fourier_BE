import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkspaceMemberTable1769200000500 implements MigrationInterface {
  name = 'CreateWorkspaceMemberTable1769200000500'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_member_role_enum') THEN
          CREATE TYPE "public"."workspace_member_role_enum" AS ENUM('owner', 'admin', 'member');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workspace_member" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" "public"."workspace_member_role_enum" NOT NULL DEFAULT 'member',
        "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid,
        "workspaceId" uuid,
        CONSTRAINT "UQ_b4104c0c92e2afdca1127be4456" UNIQUE ("userId", "workspaceId"),
        CONSTRAINT "PK_a3a35f64bf30517010551467c6e" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "workspace_member"
      ADD CONSTRAINT "FK_03ce416ae83c188274dec61205c"
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "workspace_member"
      ADD CONSTRAINT "FK_15b622cbfffabc30d7dbc52fede"
      FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workspace_member" DROP CONSTRAINT IF EXISTS "FK_15b622cbfffabc30d7dbc52fede"`);
    await queryRunner.query(`ALTER TABLE "workspace_member" DROP CONSTRAINT IF EXISTS "FK_03ce416ae83c188274dec61205c"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workspace_member"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."workspace_member_role_enum"`);
  }
}
