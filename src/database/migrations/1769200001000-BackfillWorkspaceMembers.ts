import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillWorkspaceMembers1769200001000 implements MigrationInterface {
  name = 'BackfillWorkspaceMembers1769200001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "workspace_member" ("id", "role", "joinedAt", "userId", "workspaceId")
      SELECT
        uuid_generate_v4(),
        CASE
          WHEN tm."role"::text = 'GUEST' THEN 'guest'
          ELSE 'member'
        END::"public"."workspace_member_role_enum",
        tm."joinedAt",
        tm."userId",
        t."workspaceId"
      FROM "team_member" tm
      INNER JOIN "team" t ON t."id" = tm."teamId"
      ON CONFLICT ("userId", "workspaceId") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "workspace_member" ("id", "role", "joinedAt", "userId", "workspaceId")
      SELECT
        uuid_generate_v4(),
        'owner'::"public"."workspace_member_role_enum",
        now(),
        w."createdById",
        w."id"
      FROM "workspace" w
      LEFT JOIN "workspace_member" wm
        ON wm."workspaceId" = w."id" AND wm."userId" = w."createdById"
      WHERE wm."id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // no-op: backfill is not safely reversible without audit data
  }
}
