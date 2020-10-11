import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateFilm1602409433249 implements MigrationInterface {
  name = 'CreateFilm1602409433249'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "film_format_enum" AS ENUM('vhs', 'cd', 'dvd', 'blueray')`)
    await queryRunner.query(`CREATE TYPE "film_type_enum" AS ENUM('newFilm', 'regular', 'old')`)
    await queryRunner.query(
      `CREATE TABLE "film" ("id" character varying NOT NULL, "title" character varying NOT NULL, "format" "film_format_enum" NOT NULL, "type" "film_type_enum" NOT NULL, "genre" character varying NOT NULL, "languages" text NOT NULL, "minimumAge" integer NOT NULL, "releaseDate" TIMESTAMP NOT NULL, "description" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "renterId" character varying, CONSTRAINT "PK_37ec0ffe0011ccbe438a65e3c6e" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "film" ADD CONSTRAINT "FK_259f3dc6440a2c67e324f7174f5" FOREIGN KEY ("renterId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "film" DROP CONSTRAINT "FK_259f3dc6440a2c67e324f7174f5"`)
    await queryRunner.query(`DROP TABLE "film"`)
    await queryRunner.query(`DROP TYPE "film_type_enum"`)
    await queryRunner.query(`DROP TYPE "film_format_enum"`)
  }
}
