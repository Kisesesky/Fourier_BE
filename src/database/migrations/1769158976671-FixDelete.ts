import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDelete1769158976671 implements MigrationInterface {
    name = 'FixDelete1769158976671'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_245da03cfde01c653c492d83a0d"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0"`);
        await queryRunner.query(`ALTER TABLE "project_favorite" DROP CONSTRAINT "FK_project_favorite_project"`);
        await queryRunner.query(`ALTER TABLE "project_favorite" DROP CONSTRAINT "FK_project_favorite_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_project_favorite_project"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_project_favorite_user"`);
        await queryRunner.query(`ALTER TABLE "project_favorite" DROP CONSTRAINT "UQ_project_favorite_project_user"`);
        await queryRunner.query(`CREATE INDEX "IDX_619aea1258ffec61d1c4022b7c" ON "project_favorite" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5842121a61ef679d716fd9fdd9" ON "project_favorite" ("userId") `);
        await queryRunner.query(`ALTER TABLE "project_favorite" ADD CONSTRAINT "UQ_7865041f4f54ad28b21197da01d" UNIQUE ("projectId", "userId")`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_245da03cfde01c653c492d83a0d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_favorite" ADD CONSTRAINT "FK_619aea1258ffec61d1c4022b7c5" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_favorite" ADD CONSTRAINT "FK_5842121a61ef679d716fd9fdd99" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_favorite" DROP CONSTRAINT "FK_5842121a61ef679d716fd9fdd99"`);
        await queryRunner.query(`ALTER TABLE "project_favorite" DROP CONSTRAINT "FK_619aea1258ffec61d1c4022b7c5"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0"`);
        await queryRunner.query(`ALTER TABLE "channel_member" DROP CONSTRAINT "FK_245da03cfde01c653c492d83a0d"`);
        await queryRunner.query(`ALTER TABLE "project_favorite" DROP CONSTRAINT "UQ_7865041f4f54ad28b21197da01d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5842121a61ef679d716fd9fdd9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_619aea1258ffec61d1c4022b7c"`);
        await queryRunner.query(`ALTER TABLE "project_favorite" ADD CONSTRAINT "UQ_project_favorite_project_user" UNIQUE ("projectId", "userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_project_favorite_user" ON "project_favorite" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_project_favorite_project" ON "project_favorite" ("projectId") `);
        await queryRunner.query(`ALTER TABLE "project_favorite" ADD CONSTRAINT "FK_project_favorite_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_favorite" ADD CONSTRAINT "FK_project_favorite_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_01ae975cf03c76e7ebfb14f22f0" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_member" ADD CONSTRAINT "FK_245da03cfde01c653c492d83a0d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
