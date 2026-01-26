import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTeamInviteUniqueConstraint1769205000000 implements MigrationInterface {
  name = 'UpdateTeamInviteUniqueConstraint1769205000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE t.relname = 'team_invite'
          AND c.contype = 'u'
          AND n.nspname = 'public';

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "team_invite" DROP CONSTRAINT %I', constraint_name);
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_team_invite_pending"
      ON "team_invite" ("teamId", "inviteeId")
      WHERE "status" = 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_team_invite_pending"`);
    await queryRunner.query(`ALTER TABLE "team_invite" ADD CONSTRAINT "UQ_team_invite_team_invitee" UNIQUE ("teamId", "inviteeId")`);
  }
}
