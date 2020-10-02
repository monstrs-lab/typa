/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { COMMAND_HANDLER_ARGS_METADATA } from './command-handler.decorator'
import { COMMAND_HANDLER_METADATA }      from './command-handler.decorator'
import { CommandHandler }                from './command-handler.decorator'

describe('command-handling', () => {
  describe('decorators', () => {
    describe('command-handler', () => {
      class Command {}

      class Test {
        @CommandHandler(Command)
        public static test() {}

        @CommandHandler(Command)
        public commandTest() {}
      }

      it('should enhance command handler with metadata', () => {
        const metadata = Reflect.getMetadata(COMMAND_HANDLER_METADATA, Test.test)

        expect(metadata).toEqual({ command: Command })
      })

      it('should enhance command handler with command metadata', () => {
        expect(
          Reflect.getMetadata(COMMAND_HANDLER_ARGS_METADATA, Test, 'commandTest')
        ).toBeDefined()
      })
    })
  })
})
