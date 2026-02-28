import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeChannelTypeEnumUppercase1770653000000 implements MigrationInterface {
  name = "NormalizeChannelTypeEnumUppercase1770653000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'channel_type_enum' AND e.enumlabel = 'chat'
        ) THEN
          ALTER TYPE "public"."channel_type_enum" RENAME VALUE 'chat' TO 'CHAT';
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'channel_type_enum' AND e.enumlabel = 'voice'
        ) THEN
          ALTER TYPE "public"."channel_type_enum" RENAME VALUE 'voice' TO 'VOICE';
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'channel_type_enum' AND e.enumlabel = 'video'
        ) THEN
          ALTER TYPE "public"."channel_type_enum" RENAME VALUE 'video' TO 'VIDEO';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'channel_type_enum' AND e.enumlabel = 'CHAT'
        ) THEN
          ALTER TYPE "public"."channel_type_enum" RENAME VALUE 'CHAT' TO 'chat';
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'channel_type_enum' AND e.enumlabel = 'VOICE'
        ) THEN
          ALTER TYPE "public"."channel_type_enum" RENAME VALUE 'VOICE' TO 'voice';
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'channel_type_enum' AND e.enumlabel = 'VIDEO'
        ) THEN
          ALTER TYPE "public"."channel_type_enum" RENAME VALUE 'VIDEO' TO 'video';
        END IF;
      END
      $$;
    `);
  }
}

