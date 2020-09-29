import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateDomainEvent1601318678068 implements MigrationInterface {
  name = 'CreateDomainEvent1601318678068'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "domain_event_snapshot" ("aggregateId" uuid NOT NULL, "revision" integer NOT NULL, "state" jsonb NOT NULL, CONSTRAINT "PK_ba6b1f212dfa4cdffad3b86ba67" PRIMARY KEY ("aggregateId", "revision"))`
    )
    await queryRunner.query(
      `CREATE TABLE "domain_event" ("aggregateId" uuid NOT NULL, "revision" integer NOT NULL, "causationId" uuid NOT NULL, "correlationId" uuid NOT NULL, "timestamp" bigint NOT NULL, "domainEvent" jsonb NOT NULL, CONSTRAINT "PK_a781a24ace43fb7e287a3e1bb74" PRIMARY KEY ("aggregateId", "revision"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "domain_event"`)
    await queryRunner.query(`DROP TABLE "domain_event_snapshot"`)
  }
}
