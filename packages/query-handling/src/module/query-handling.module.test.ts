/* eslint-disable max-classes-per-file */

import { Module }                             from '@nestjs/common'
import { Test }                               from '@nestjs/testing'

import { QueryGateway }                       from '../gateway'
import { QueryHandlingModuleOptions }         from './query-handling-module-options.interface'
import { TYPA_QUERY_HANDLING_MODULE_OPTIONS } from './query-handling.constants'
import { TypaQueryHandlingModule }            from './query-handling.module'

describe('query-handling', () => {
  describe('module', () => {
    let module

    afterEach(async () => {
      await module.close()
    })

    it(`register`, async () => {
      module = await Test.createTestingModule({
        imports: [TypaQueryHandlingModule.register()],
      }).compile()

      expect(module.get(TYPA_QUERY_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(QueryGateway)).toBeDefined()
    })

    it(`register async use factory`, async () => {
      module = await Test.createTestingModule({
        imports: [
          TypaQueryHandlingModule.registerAsync({
            useFactory: () => ({}),
          }),
        ],
      }).compile()

      expect(module.get(TYPA_QUERY_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(QueryGateway)).toBeDefined()
    })

    it(`register async use class`, async () => {
      class TestQueryHandlingModuleOptions {
        createQueryHandlingOptions(): QueryHandlingModuleOptions {
          return {}
        }
      }

      module = await Test.createTestingModule({
        imports: [
          TypaQueryHandlingModule.registerAsync({
            useClass: TestQueryHandlingModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_QUERY_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(QueryGateway)).toBeDefined()
    })

    it(`register async use exists`, async () => {
      class TestQueryHandlingModuleOptions {
        createQueryHandlingOptions(): QueryHandlingModuleOptions {
          return {}
        }
      }

      @Module({})
      class TestQueryHandlingModule {}

      module = await Test.createTestingModule({
        imports: [
          TypaQueryHandlingModule.registerAsync({
            imports: [
              {
                module: TestQueryHandlingModule,
                providers: [TestQueryHandlingModuleOptions],
                exports: [TestQueryHandlingModuleOptions],
              },
            ],
            useExisting: TestQueryHandlingModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_QUERY_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(QueryGateway)).toBeDefined()
    })
  })
})
