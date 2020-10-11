import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateCustomer1602402300888 implements MigrationInterface {
  name = 'CreateCustomer1602402300888'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "customer" ("id" character varying NOT NULL, "fullName" character varying NOT NULL, "phoneNumber" character varying NOT NULL, "bonusPoints" integer NOT NULL DEFAULT 0, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "customer"`)
  }
}
