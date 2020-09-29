import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreatePriorityQueue1601364800036 implements MigrationInterface {
  name = 'CreatePriorityQueue1601364800036'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "domain_event_priority_queue_item" ("discriminator" character varying(100) NOT NULL, "indexInQueue" integer NOT NULL, "priority" bigint NOT NULL, "item" jsonb NOT NULL, CONSTRAINT "PK_c25b1fd3d89a6344a51bb6a6966" PRIMARY KEY ("discriminator", "indexInQueue"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_554919ac37ce1c04a8a0ffd7ad" ON "domain_event_priority_queue_item" ("discriminator") `
    )
    await queryRunner.query(
      `CREATE TABLE "domain_event_priority_queue" ("discriminator" character varying(100) NOT NULL, "indexInPriorityQueue" integer NOT NULL, "lockUntil" bigint, "lockToken" uuid, CONSTRAINT "PK_955f77000135ef86425ead23cf4" PRIMARY KEY ("discriminator"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_f358a2e3fdcc04ee320a0592ad" ON "domain_event_priority_queue" ("indexInPriorityQueue") `
    )
    await queryRunner.query(
      `CREATE TABLE "command_priority_queue_item" ("discriminator" character varying(100) NOT NULL, "indexInQueue" integer NOT NULL, "priority" bigint NOT NULL, "item" jsonb NOT NULL, CONSTRAINT "PK_8ade3648d456dc36be244f3bc9f" PRIMARY KEY ("discriminator", "indexInQueue"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_6ad6cb209a02b4055d8541e462" ON "command_priority_queue_item" ("discriminator") `
    )
    await queryRunner.query(
      `CREATE TABLE "command_priority_queue" ("discriminator" character varying(100) NOT NULL, "indexInPriorityQueue" integer NOT NULL, "lockUntil" bigint, "lockToken" uuid, CONSTRAINT "PK_e6f650271e78d6690183a48f62a" PRIMARY KEY ("discriminator"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_4a03a088a6b93651f9c7d115bf" ON "command_priority_queue" ("indexInPriorityQueue") `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_4a03a088a6b93651f9c7d115bf"`)
    await queryRunner.query(`DROP TABLE "command_priority_queue"`)
    await queryRunner.query(`DROP INDEX "IDX_6ad6cb209a02b4055d8541e462"`)
    await queryRunner.query(`DROP TABLE "command_priority_queue_item"`)
    await queryRunner.query(`DROP INDEX "IDX_f358a2e3fdcc04ee320a0592ad"`)
    await queryRunner.query(`DROP TABLE "domain_event_priority_queue"`)
    await queryRunner.query(`DROP INDEX "IDX_554919ac37ce1c04a8a0ffd7ad"`)
    await queryRunner.query(`DROP TABLE "domain_event_priority_queue_item"`)
  }
}
