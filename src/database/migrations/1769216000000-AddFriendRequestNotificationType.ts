import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFriendRequestNotificationType1769216000000 implements MigrationInterface {
  name = 'AddFriendRequestNotificationType1769216000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" ADD VALUE IF NOT EXISTS 'FRIEND_REQUEST'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."notification_type_enum_old" AS ENUM('DOC_MENTION', 'DOC_UPDATE', 'ISSUE_ASSIGNED', 'CHAT_MENTION', 'TEAM_INVITE')`);
    await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::text::"public"."notification_type_enum_old"`);
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`);
  }
}
