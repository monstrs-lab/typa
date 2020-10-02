import 'reflect-metadata'

import { COMMAND_HANDLER_ARGS_METADATA } from './command-handler.decorator'
import { Command }                       from './command.decorator'

describe('command-handling', () => {
  describe('decorators', () => {
    describe('command', () => {
      class Test {
        public test(@Command command) {}
      }

      it('should enhance command with metadata', () => {
        const metadata = Reflect.getMetadata(COMMAND_HANDLER_ARGS_METADATA, Test, 'test')
        const key = Object.keys(metadata)[0]

        expect(metadata[key]).toEqual({
          index: 0,
        })
      })
    })
  })
})
