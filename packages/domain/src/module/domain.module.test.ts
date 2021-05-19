/* eslint-disable max-classes-per-file */

import { Module }                     from '@nestjs/common'
import { Test }                       from '@nestjs/testing'

import { TypaStorageModule }          from '@typa/storage'

import { Repository }                 from '../aggregate'
import { DomainModuleOptions }        from './domain-module-options.interface'
import { TYPA_DOMAIN_MODULE_OPTIONS } from './domain.constants'
import { TypaDomainModule }           from './domain.module'

describe('domain', () => {
  describe('module', () => {
    let module

    afterEach(async () => {
      await module.close()
    })

    it(`register`, async () => {
      module = await Test.createTestingModule({
        imports: [TypaStorageModule.register(), TypaDomainModule.register()],
      }).compile()

      expect(module.get(TYPA_DOMAIN_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(Repository)).toBeDefined()
    })

    it(`register async use factory`, async () => {
      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaDomainModule.registerAsync({
            useFactory: () => ({}),
          }),
        ],
      }).compile()

      expect(module.get(TYPA_DOMAIN_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(Repository)).toBeDefined()
    })

    it(`register async use class`, async () => {
      class TestDomainModuleOptions {
        createDomainOptions(): DomainModuleOptions {
          return {}
        }
      }

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaDomainModule.registerAsync({
            useClass: TestDomainModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_DOMAIN_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(Repository)).toBeDefined()
    })

    it(`register async use exists`, async () => {
      class TestDomainModuleOptions {
        createDomainOptions(): DomainModuleOptions {
          return {}
        }
      }

      @Module({})
      class TestDomainModule {}

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaDomainModule.registerAsync({
            imports: [
              {
                module: TestDomainModule,
                providers: [TestDomainModuleOptions],
                exports: [TestDomainModuleOptions],
              },
            ],
            useExisting: TestDomainModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_DOMAIN_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(Repository)).toBeDefined()
    })
  })
})
