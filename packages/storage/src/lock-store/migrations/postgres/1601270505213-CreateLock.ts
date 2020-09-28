import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateLock1601270505213 implements MigrationInterface {
  name = 'CreateLock1601270505213'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lock" ("value" character varying(64) NOT NULL, "expiresAt" bigint NOT NULL, CONSTRAINT "PK_d62517b124014e546fd3da6347e" PRIMARY KEY ("value"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "lock"`)
  }
}
