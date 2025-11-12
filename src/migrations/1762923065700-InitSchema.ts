import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1762923065700 implements MigrationInterface {
    name = 'InitSchema1762923065700'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "note_views" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "noteId" integer, "viewerId" integer, CONSTRAINT "UQ_583aa46dd8a1731421e27c8d50d" UNIQUE ("noteId", "viewerId"), CONSTRAINT "PK_ba3c426c35cadcc8014fcc55700" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "note_likes" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "noteId" integer, "profileId" integer, CONSTRAINT "UQ_8ffc1c53ab7ea71f8d59d1e9930" UNIQUE ("noteId", "profileId"), CONSTRAINT "PK_b4e25b26da77e743dcd8d619c40" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "note_comments" ("id" SERIAL NOT NULL, "text" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "noteId" integer, "authorId" integer, CONSTRAINT "PK_c0efbfec4b436e5faeaeea166fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notes" ("id" SERIAL NOT NULL, "title" character varying, "content" text NOT NULL, "is_code_mode" boolean NOT NULL DEFAULT false, "code_language" character varying, "reminder_at" TIMESTAMP, "seo_slug" character varying, "tags" character varying, "visibility" character varying NOT NULL DEFAULT 'public', "allow_comments" boolean NOT NULL DEFAULT true, "share_to_twitter" boolean NOT NULL DEFAULT false, "is_public" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "profileId" integer, CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "profiles" ("id" SERIAL NOT NULL, "firstName" character varying, "lastName" character varying, "username" character varying, "avatar" character varying, "coverImage" character varying, "userId" integer, CONSTRAINT "UQ_d1ea35db5be7c08520d70dc03f8" UNIQUE ("username"), CONSTRAINT "REL_315ecd98bd1a42dcf2ec4e2e98" UNIQUE ("userId"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "follows" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "followerId" integer, "followingId" integer, CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "onesignal_player_ids" text array NOT NULL DEFAULT '{}', "profileId" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "REL_b1bda35cdb9a2c1b777f5541d8" UNIQUE ("profileId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "file_entity" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d8375e0b2592310864d2b4974b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "note_shares" ("note_id" integer NOT NULL, "profile_id" integer NOT NULL, CONSTRAINT "PK_b3f39694d5abb577fcc0151f467" PRIMARY KEY ("note_id", "profile_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5e1d08d7a1033f2d1d56e33cb3" ON "note_shares" ("note_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ebb72c8d5b0ecd99f385c4e062" ON "note_shares" ("profile_id") `);
        await queryRunner.query(`ALTER TABLE "note_views" ADD CONSTRAINT "FK_fd26f78a168439be72a96e101ea" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_views" ADD CONSTRAINT "FK_37bc2627e339b9e0a2e03e06a20" FOREIGN KEY ("viewerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_likes" ADD CONSTRAINT "FK_96b8de926816a87a054a0f089ff" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_likes" ADD CONSTRAINT "FK_756547f6ef39d5c6491dadcdfa4" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_comments" ADD CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_comments" ADD CONSTRAINT "FK_9d08057e38f3eae8d8650767a99" FOREIGN KEY ("authorId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notes" ADD CONSTRAINT "FK_b1650eacdee60dbc00f472ceb80" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_fdb91868b03a2040db408a53331" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_b1bda35cdb9a2c1b777f5541d87" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_shares" ADD CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "note_shares" ADD CONSTRAINT "FK_ebb72c8d5b0ecd99f385c4e062b" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "note_shares" DROP CONSTRAINT "FK_ebb72c8d5b0ecd99f385c4e062b"`);
        await queryRunner.query(`ALTER TABLE "note_shares" DROP CONSTRAINT "FK_5e1d08d7a1033f2d1d56e33cb3d"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_b1bda35cdb9a2c1b777f5541d87"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_fdb91868b03a2040db408a53331"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_b1650eacdee60dbc00f472ceb80"`);
        await queryRunner.query(`ALTER TABLE "note_comments" DROP CONSTRAINT "FK_9d08057e38f3eae8d8650767a99"`);
        await queryRunner.query(`ALTER TABLE "note_comments" DROP CONSTRAINT "FK_f835b27bfc466ef7c157c0fd0a4"`);
        await queryRunner.query(`ALTER TABLE "note_likes" DROP CONSTRAINT "FK_756547f6ef39d5c6491dadcdfa4"`);
        await queryRunner.query(`ALTER TABLE "note_likes" DROP CONSTRAINT "FK_96b8de926816a87a054a0f089ff"`);
        await queryRunner.query(`ALTER TABLE "note_views" DROP CONSTRAINT "FK_37bc2627e339b9e0a2e03e06a20"`);
        await queryRunner.query(`ALTER TABLE "note_views" DROP CONSTRAINT "FK_fd26f78a168439be72a96e101ea"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebb72c8d5b0ecd99f385c4e062"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e1d08d7a1033f2d1d56e33cb3"`);
        await queryRunner.query(`DROP TABLE "note_shares"`);
        await queryRunner.query(`DROP TABLE "file_entity"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "follows"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TABLE "notes"`);
        await queryRunner.query(`DROP TABLE "note_comments"`);
        await queryRunner.query(`DROP TABLE "note_likes"`);
        await queryRunner.query(`DROP TABLE "note_views"`);
    }

}
