/* eslint-disable max-classes-per-file */

import { Module }                               from '@nestjs/common'
import { Test }                                 from '@nestjs/testing'

import { TypaEventHandlingModule }              from '@typa/event-handling'
import { TypaEventSourcingModule }              from '@typa/event-sourcing'
import { TypaStorageModule }                    from '@typa/storage'

import { CommandGateway }                       from '../gateway'
import { CommandHandlingModuleOptions }         from './command-handling-module-options.interface'
import { TYPA_COMMAND_HANDLING_MODULE_OPTIONS } from './command-handling.constants'
import { TypaCommandHandlingModule }            from './command-handling.module'

describe('command-handling', () => {
  describe('module', () => {
    let module

    afterEach(async () => {
      await module.close()
    })

    it(`register`, async () => {
      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventSourcingModule.register(),
          TypaEventHandlingModule.register(),
          TypaCommandHandlingModule.register(),
        ],
      }).compile()

      expect(module.get(TYPA_COMMAND_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(CommandGateway)).toBeDefined()
    })

    it(`register async use factory`, async () => {
      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventSourcingModule.register(),
          TypaEventHandlingModule.register(),
          TypaCommandHandlingModule.registerAsync({
            useFactory: () => ({}),
          }),
        ],
      }).compile()

      expect(module.get(TYPA_COMMAND_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(CommandGateway)).toBeDefined()
    })

    it(`register async use class`, async () => {
      class TestCommandHandlingModuleOptions {
        createCommandHandlingOptions(): CommandHandlingModuleOptions {
          return {}
        }
      }

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventSourcingModule.register(),
          TypaEventHandlingModule.register(),
          TypaCommandHandlingModule.registerAsync({
            useClass: TestCommandHandlingModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_COMMAND_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(CommandGateway)).toBeDefined()
    })

    it(`register async use exists`, async () => {
      class TestCommandHandlingModuleOptions {
        createCommandHandlingOptions(): CommandHandlingModuleOptions {
          return {}
        }
      }

      @Module({})
      class TestCommandHandlingModule {}

      module = await Test.createTestingModule({
        imports: [
          TypaStorageModule.register(),
          TypaEventSourcingModule.register(),
          TypaEventHandlingModule.register(),
          TypaCommandHandlingModule.registerAsync({
            imports: [
              {
                module: TestCommandHandlingModule,
                providers: [TestCommandHandlingModuleOptions],
                exports: [TestCommandHandlingModuleOptions],
              },
            ],
            useExisting: TestCommandHandlingModuleOptions,
          }),
        ],
      }).compile()

      expect(module.get(TYPA_COMMAND_HANDLING_MODULE_OPTIONS)).toBeDefined()
      expect(module.get(CommandGateway)).toBeDefined()
    })
  })
})
