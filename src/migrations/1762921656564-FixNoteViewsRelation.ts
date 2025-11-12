import { MigrationInterface, QueryRunner } from "typeorm";

export class FixNoteViewsRelation1762921656564 implements MigrationInterface {
    name = 'FixNoteViewsRelation1762921656564'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_likes" DROP CONSTRAINT "FK_96b8de926816a87a054a0f089ff"`);
        await queryRunner.query(`ALTER TABLE "note_comments" DROP CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4"`);
        await queryRunner.query(`ALTER TABLE "note_shares" DROP CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d"`);
        await queryRunner.query(`CREATE TABLE "note_views" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "noteId" integer, "viewerId" integer, CONSTRAINT "UQ_583aa46dd8a1731421e27c8d50d" UNIQUE ("noteId", "viewerId"), CONSTRAINT "PK_ba3c426c35cadcc8014fcc55700" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notes" ("id" SERIAL NOT NULL, "title" character varying, "content" text NOT NULL, "is_code_mode" boolean NOT NULL DEFAULT false, "code_language" character varying, "reminder_at" TIMESTAMP, "seo_slug" character varying, "tags" character varying, "visibility" character varying NOT NULL DEFAULT 'public', "allow_comments" boolean NOT NULL DEFAULT true, "share_to_twitter" boolean NOT NULL DEFAULT false, "is_public" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "profileId" integer, CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "note_views" ADD CONSTRAINT "FK_fd26f78a168439be72a96e101ea" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_views" ADD CONSTRAINT "FK_37bc2627e339b9e0a2e03e06a20" FOREIGN KEY ("viewerId") REFERENCES "profile_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_likes" ADD CONSTRAINT "FK_96b8de926816a87a054a0f089ff" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_comments" ADD CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notes" ADD CONSTRAINT "FK_b1650eacdee60dbc00f472ceb80" FOREIGN KEY ("profileId") REFERENCES "profile_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_shares" ADD CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_shares" DROP CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_b1650eacdee60dbc00f472ceb80"`);
        await queryRunner.query(`ALTER TABLE "note_comments" DROP CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4"`);
        await queryRunner.query(`ALTER TABLE "note_likes" DROP CONSTRAINT "FK_96b8de926816a87a054a0f089ff"`);
        await queryRunner.query(`ALTER TABLE "note_views" DROP CONSTRAINT "FK_37bc2627e339b9e0a2e03e06a20"`);
        await queryRunner.query(`ALTER TABLE "note_views" DROP CONSTRAINT "FK_fd26f78a168439be72a96e101ea"`);
        await queryRunner.query(`DROP TABLE "notes"`);
        await queryRunner.query(`DROP TABLE "note_views"`);
        await queryRunner.query(`ALTER TABLE "note_shares" ADD CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d" FOREIGN KEY ("note_id") REFERENCES "notes_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "note_comments" ADD CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4" FOREIGN KEY ("noteId") REFERENCES "notes_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_likes" ADD CONSTRAINT "FK_96b8de926816a87a054a0f089ff" FOREIGN KEY ("noteId") REFERENCES "notes_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
