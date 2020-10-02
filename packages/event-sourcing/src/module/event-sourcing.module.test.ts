/* eslint-disable max-classes-per-file */

import { Module }                             from '@nestjs/common'
import { Test }                               from '@nestjs/testing'

import { TypaStorageModule }                  from '@typa/storage'

import { Repository }                         from '../aggregate'
import { EventSourcingModuleOptions }         from './event-sourcing-module-options.interface'
import { TYPA_EVENT_SOURCING_MODULE_OPTIONS } from './event-sourcing.constants'
import { TypaEventSourcingModule }            from './event-sourcing.module'

describe('event-sourcing', () => {
  describe('module', () => {
    let module

    afterEach(async () => {
      await module.close()
    })

    it(`register`, async () => {
      module = await Test.createTestingModule({
        imports: [TypaStorageModule.register(), TypaEventSourcingModule.register()],
      }).compile()

      expect(module.get(TYPA_EVENT_SOURCING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(Repository)).toBeDefined()
    })

    it(`register async use factory`, async () => {
      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventSourcingModule.registerAsync({
            useFactory: () => ({}),
          }),
        ],
      }).compile()

      expect(module.get(TYPA_EVENT_SOURCING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(Repository)).toBeDefined()
    })

    it(`register async use class`, async () => {
      class TestEventSourcingModuleOptions {
        createEventSourcingOptions(): EventSourcingModuleOptions {
          return {}
        }
      }

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventSourcingModule.registerAsync({
            useClass: TestEventSourcingModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_EVENT_SOURCING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(Repository)).toBeDefined()
    })

    it(`register async use exists`, async () => {
      class TestEventSourcingModuleOptions {
        createEventSourcingOptions(): EventSourcingModuleOptions {
          return {}
        }
      }

      @Module({})
      class TestEventSourcingModule {}

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventSourcingModule.registerAsync({
            imports: [
              {
                module: TestEventSourcingModule,
                providers: [TestEventSourcingModuleOptions],
                exports: [TestEventSourcingModuleOptions],
              },
            ],
            useExisting: TestEventSourcingModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_EVENT_SOURCING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(Repository)).toBeDefined()
    })
  })
})
