import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatModuleETCsender1768477997929 implements MigrationInterface {
    name = 'AddChatModuleETCsender1768477997929'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "thread_read" DROP CONSTRAINT "FK_7884013b227fabb3da4a10440fa"`);
        await queryRunner.query(`ALTER TABLE "thread_read" RENAME COLUMN "parentMessageId" TO "threadParentId"`);
        await queryRunner.query(`ALTER TABLE "thread_read" ADD CONSTRAINT "FK_5fcc12ecf5bf4b694424ac23a66" FOREIGN KEY ("threadParentId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "thread_read" DROP CONSTRAINT "FK_5fcc12ecf5bf4b694424ac23a66"`);
        await queryRunner.query(`ALTER TABLE "thread_read" RENAME COLUMN "threadParentId" TO "parentMessageId"`);
        await queryRunner.query(`ALTER TABLE "thread_read" ADD CONSTRAINT "FK_7884013b227fabb3da4a10440fa" FOREIGN KEY ("parentMessageId") REFERENCES "channel_message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
