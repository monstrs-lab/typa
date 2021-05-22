/* eslint-disable max-classes-per-file */

import { Module }                             from '@nestjs/common'
import { Test }                               from '@nestjs/testing'

import { TypaStorageModule }                  from '@typa/storage'

import { SimpleDomainEventPublisher }         from '../publisher'
import { EventHandlingModuleOptions }         from './event-handling-module-options.interface'
import { TYPA_EVENT_HANDLING_MODULE_OPTIONS } from './event-handling.constants'
import { TypaEventHandlingModule }            from './event-handling.module'

describe('event-handling', () => {
  describe('module', () => {
    let module

    afterEach(async () => {
      await module.close()
    })

    it(`register`, async () => {
      module = await Test.createTestingModule({
        imports: [TypaStorageModule.register(), TypaEventHandlingModule.register()],
      }).compile()

      expect(module.get(TYPA_EVENT_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(SimpleDomainEventPublisher)).toBeDefined()
    })

    it(`register async use factory`, async () => {
      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventHandlingModule.registerAsync({
            useFactory: () => ({}),
          }),
        ],
      }).compile()

      expect(module.get(TYPA_EVENT_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(SimpleDomainEventPublisher)).toBeDefined()
    })

    it(`register async use class`, async () => {
      class TestEventHandlingModuleOptions {
        createEventHandlingOptions(): EventHandlingModuleOptions {
          return {}
        }
      }

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventHandlingModule.registerAsync({
            useClass: TestEventHandlingModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_EVENT_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(SimpleDomainEventPublisher)).toBeDefined()
    })

    it(`register async use exists`, async () => {
      class TestEventHandlingModuleOptions {
        createEventHandlingOptions(): EventHandlingModuleOptions {
          return {}
        }
      }

      @Module({})
      class TestEventHandlingModule {}

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventHandlingModule.registerAsync({
            imports: [
              {
                module: TestEventHandlingModule,
                providers: [TestEventHandlingModuleOptions],
                exports: [TestEventHandlingModuleOptions],
              },
            ],
            useExisting: TestEventHandlingModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_EVENT_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(SimpleDomainEventPublisher)).toBeDefined()
    })
  })
})
