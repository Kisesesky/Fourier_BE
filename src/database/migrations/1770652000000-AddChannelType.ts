import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChannelType1770652000000 implements MigrationInterface {
  name = 'AddChannelType1770652000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."channel_type_enum" AS ENUM('CHAT', 'VOICE', 'VIDEO')`);
    await queryRunner.query(`ALTER TABLE "channel" ADD "type" "public"."channel_type_enum" NOT NULL DEFAULT 'CHAT'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."channel_type_enum"`);
  }
}
