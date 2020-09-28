import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateConsumerProgress1601306663514 implements MigrationInterface {
  name = 'CreateConsumerProgress1601306663514'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "consumer_progress" ("consumerId" character varying(64) NOT NULL, "aggregateId" uuid NOT NULL, "revision" integer NOT NULL, "isReplayingFrom" integer, "isReplayingTo" integer, CONSTRAINT "PK_77111585c43faf7a42bb86f5bdc" PRIMARY KEY ("consumerId", "aggregateId"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "consumer_progress"`)
  }
}
