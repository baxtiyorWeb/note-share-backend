import { MigrationInterface, QueryRunner } from "typeorm";

export class FixNoteRelations1762922340066 implements MigrationInterface {
    name = 'FixNoteRelations1762922340066'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_views" DROP CONSTRAINT "FK_fd26f78a168439be72a96e101ea"`);
        await queryRunner.query(`ALTER TABLE "note_views" DROP CONSTRAINT "FK_37bc2627e339b9e0a2e03e06a20"`);
        await queryRunner.query(`ALTER TABLE "note_likes" DROP CONSTRAINT "FK_96b8de926816a87a054a0f089ff"`);
        await queryRunner.query(`ALTER TABLE "note_likes" DROP CONSTRAINT "FK_756547f6ef39d5c6491dadcdfa4"`);
        await queryRunner.query(`ALTER TABLE "note_comments" DROP CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4"`);
        await queryRunner.query(`ALTER TABLE "note_comments" DROP CONSTRAINT "FK_9d08057e38f3eae8d8650767a99"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_b1bda35cdb9a2c1b777f5541d87"`);
        await queryRunner.query(`ALTER TABLE "note_shares" DROP CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d"`);
        await queryRunner.query(`ALTER TABLE "note_shares" DROP CONSTRAINT "FK_ebb72c8d5b0ecd99f385c4e062b"`);
        await queryRunner.query(`CREATE TABLE "notes" ("id" SERIAL NOT NULL, "title" character varying, "content" text NOT NULL, "is_code_mode" boolean NOT NULL DEFAULT false, "code_language" character varying, "reminder_at" TIMESTAMP, "seo_slug" character varying, "tags" character varying, "visibility" character varying NOT NULL DEFAULT 'public', "allow_comments" boolean NOT NULL DEFAULT true, "share_to_twitter" boolean NOT NULL DEFAULT false, "is_public" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "profileId" integer, CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "profiles" ("id" SERIAL NOT NULL, "firstName" character varying, "lastName" character varying, "username" character varying, "avatar" character varying, "coverImage" character varying, "userId" integer, CONSTRAINT "UQ_d1ea35db5be7c08520d70dc03f8" UNIQUE ("username"), CONSTRAINT "REL_315ecd98bd1a42dcf2ec4e2e98" UNIQUE ("userId"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "note_views" ADD CONSTRAINT "FK_fd26f78a168439be72a96e101ea" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_views" ADD CONSTRAINT "FK_37bc2627e339b9e0a2e03e06a20" FOREIGN KEY ("viewerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_likes" ADD CONSTRAINT "FK_96b8de926816a87a054a0f089ff" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_likes" ADD CONSTRAINT "FK_756547f6ef39d5c6491dadcdfa4" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_comments" ADD CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_comments" ADD CONSTRAINT "FK_9d08057e38f3eae8d8650767a99" FOREIGN KEY ("authorId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notes" ADD CONSTRAINT "FK_b1650eacdee60dbc00f472ceb80" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_b1bda35cdb9a2c1b777f5541d87" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_shares" ADD CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "note_shares" ADD CONSTRAINT "FK_ebb72c8d5b0ecd99f385c4e062b" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_shares" DROP CONSTRAINT "FK_ebb72c8d5b0ecd99f385c4e062b"`);
        await queryRunner.query(`ALTER TABLE "note_shares" DROP CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_b1bda35cdb9a2c1b777f5541d87"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_b1650eacdee60dbc00f472ceb80"`);
        await queryRunner.query(`ALTER TABLE "note_comments" DROP CONSTRAINT "FK_9d08057e38f3eae8d8650767a99"`);
        await queryRunner.query(`ALTER TABLE "note_comments" DROP CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4"`);
        await queryRunner.query(`ALTER TABLE "note_likes" DROP CONSTRAINT "FK_756547f6ef39d5c6491dadcdfa4"`);
        await queryRunner.query(`ALTER TABLE "note_likes" DROP CONSTRAINT "FK_96b8de926816a87a054a0f089ff"`);
        await queryRunner.query(`ALTER TABLE "note_views" DROP CONSTRAINT "FK_37bc2627e339b9e0a2e03e06a20"`);
        await queryRunner.query(`ALTER TABLE "note_views" DROP CONSTRAINT "FK_fd26f78a168439be72a96e101ea"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TABLE "notes"`);
        await queryRunner.query(`ALTER TABLE "note_shares" ADD CONSTRAINT "FK_ebb72c8d5b0ecd99f385c4e062b" FOREIGN KEY ("profile_id") REFERENCES "profile_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "note_shares" ADD CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d" FOREIGN KEY ("note_id") REFERENCES "notes_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_b1bda35cdb9a2c1b777f5541d87" FOREIGN KEY ("profileId") REFERENCES "profile_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_comments" ADD CONSTRAINT "FK_9d08057e38f3eae8d8650767a99" FOREIGN KEY ("authorId") REFERENCES "profile_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_comments" ADD CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4" FOREIGN KEY ("noteId") REFERENCES "notes_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_likes" ADD CONSTRAINT "FK_756547f6ef39d5c6491dadcdfa4" FOREIGN KEY ("profileId") REFERENCES "profile_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_likes" ADD CONSTRAINT "FK_96b8de926816a87a054a0f089ff" FOREIGN KEY ("noteId") REFERENCES "notes_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_views" ADD CONSTRAINT "FK_37bc2627e339b9e0a2e03e06a20" FOREIGN KEY ("viewerId") REFERENCES "profile_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_views" ADD CONSTRAINT "FK_fd26f78a168439be72a96e101ea" FOREIGN KEY ("noteId") REFERENCES "notes_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
