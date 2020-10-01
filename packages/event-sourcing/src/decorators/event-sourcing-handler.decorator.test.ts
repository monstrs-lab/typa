/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { DOMAIN_EVENT_ARGS_METADATA }      from './domain-event.decorator'
import { EVENT_SOURCING_HANDLER_METADATA } from './event-sourcing-handler.decorator'
import { EventSourcingHandler }            from './event-sourcing-handler.decorator'

describe('event-sourcing', () => {
  describe('decorators', () => {
    describe('event-sourcing-handler', () => {
      class Event {}

      class Test {
        @EventSourcingHandler(Event)
        public static test() {}

        @EventSourcingHandler(Event)
        public eventTest() {}
      }

      it('should enhance event sourcing handler with metadata', () => {
        const metadata = Reflect.getMetadata(EVENT_SOURCING_HANDLER_METADATA, Test.test)

        expect(metadata).toEqual({ event: Event })
      })

      it('should enhance event sourcing handler with domain event metadata', () => {
        expect(Reflect.getMetadata(DOMAIN_EVENT_ARGS_METADATA, Test, 'eventTest')).toBeDefined()
      })
    })
  })
})
