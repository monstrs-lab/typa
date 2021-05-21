import { Test }                 from '@nestjs/testing'
import { Connection }           from 'typeorm'
import { MigrationInterface }   from 'typeorm'
import { QueryRunner }          from 'typeorm'

import { TypaStorageModule }    from '../module'
import { TypaProjectionModule } from './projection.module'

describe('storage', () => {
  describe('module', () => {
    let module

    afterEach(async () => {
      await module.close()
    })

    it(`projection migrations`, async () => {
      class TestMigration implements MigrationInterface {
        name = 'Test1596548352484'

        public async up(queryRunner: QueryRunner): Promise<void> {
          await queryRunner.query(
            'CREATE TABLE "test_migration" ("id" character varying NOT NULL)',
            undefined
          )
        }

        public async down(queryRunner: QueryRunner): Promise<void> {
          await queryRunner.query('DROP TABLE "test_migration"', undefined)
        }
      }

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaProjectionModule.register({
            migrations: [TestMigration],
          }),
        ],
      }).compile()

      expect(module.get(Connection).options.migrations).toContain(TestMigration)
    })
  })
})
