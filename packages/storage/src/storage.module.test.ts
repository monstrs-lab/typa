/* eslint-disable max-classes-per-file */

import { Module }                      from '@nestjs/common'
import { Test }                        from '@nestjs/testing'
import { Connection }                  from 'typeorm'

import { StorageModuleOptions }        from './interfaces'
import { TYPA_STORAGE_MODULE_OPTIONS } from './storage.constants'
import { TypaStorageModule }           from './storage.module'
import { TypeOrmConfig }               from './typeorm.config'

describe('storage', () => {
  describe('module', () => {
    let module

    afterEach(async () => {
      await module.close()
    })

    it(`register`, async () => {
      module = await Test.createTestingModule({
        imports: [TypaStorageModule.register()],
      }).compile()

      expect(module.get(TYPA_STORAGE_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(TypeOrmConfig)).toBeDefined()
      expect(module.get(Connection)).toBeDefined()
    })

    it(`register async use factory`, async () => {
      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.registerAsync({
            useFactory: () => ({ type: 'inmemory' }),
          }),
        ],
      }).compile()

      expect(module.get(TYPA_STORAGE_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(TypeOrmConfig)).toBeDefined()
      expect(module.get(Connection)).toBeDefined()
    })

    it(`register async use class`, async () => {
      class TestStorageModuleOptions {
        createStorageOptions(): StorageModuleOptions {
          return { type: 'inmemory' }
        }
      }

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.registerAsync({
            useClass: TestStorageModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_STORAGE_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(TypeOrmConfig)).toBeDefined()
      expect(module.get(Connection)).toBeDefined()
    })

    it(`register async use exists`, async () => {
      class TestStorageModuleOptions {
        createStorageOptions(): StorageModuleOptions {
          return { type: 'inmemory' }
        }
      }

      @Module({})
      class TestStorageModule {}

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.registerAsync({
            imports: [
              {
                module: TestStorageModule,
                providers: [TestStorageModuleOptions],
                exports: [TestStorageModuleOptions],
              },
            ],
            useExisting: TestStorageModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_STORAGE_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(TypeOrmConfig)).toBeDefined()
      expect(module.get(Connection)).toBeDefined()
    })
  })
})
