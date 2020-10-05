/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { EVENT_HANDLER_METADATA } from './event-handler.decorator'
import { EventHandler }           from './event-handler.decorator'

describe('event-handling', () => {
  describe('decorators', () => {
    describe('event-handler', () => {
      class TestEvent {}

      class Test {
        @EventHandler(TestEvent)
        public static test() {}
      }

      it('should enhance event handler with metadata', () => {
        const metadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, Test.test)

        expect(metadata).toEqual({ event: TestEvent })
      })
    })
  })
})
