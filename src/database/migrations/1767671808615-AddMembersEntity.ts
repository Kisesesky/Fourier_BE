import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMembersEntity1767671808615 implements MigrationInterface {
    name = 'AddMembersEntity1767671808615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_7b7c10b51b0da1fe47a8ee14ed2"`);
        await queryRunner.query(`ALTER TABLE "members" ADD "requesterId" uuid`);
        await queryRunner.query(`ALTER TABLE "members" ADD CONSTRAINT "FK_d461d9ef17b1cd1bb5e39f14f4e" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "members" ADD CONSTRAINT "FK_7b7c10b51b0da1fe47a8ee14ed2" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_7b7c10b51b0da1fe47a8ee14ed2"`);
        await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_d461d9ef17b1cd1bb5e39f14f4e"`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "requesterId"`);
        await queryRunner.query(`ALTER TABLE "members" ADD CONSTRAINT "FK_7b7c10b51b0da1fe47a8ee14ed2" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
