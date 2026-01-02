import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1767344479026 implements MigrationInterface {
    name = 'FirstMigration1767344479026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "email" character varying, "name" character varying NOT NULL, "avatarUrl" character varying, "password" character varying, "provider" character varying NOT NULL, "providerId" character varying, "agreedTerms" boolean NOT NULL DEFAULT false, "agreedPrivacy" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
