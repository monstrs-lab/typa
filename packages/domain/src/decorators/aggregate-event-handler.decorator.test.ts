/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { DOMAIN_EVENT_ARGS_METADATA }       from './domain-event.decorator'
import { AGGREGATE_EVENT_HANDLER_METADATA } from './aggregate-event-handler.decorator'
import { AggregateEventHandler }            from './aggregate-event-handler.decorator'

describe('event-sourcing', () => {
  describe('decorators', () => {
    describe('event-sourcing-handler', () => {
      class Event {}

      class Test {
        @AggregateEventHandler(Event)
        public static test() {}

        @AggregateEventHandler(Event)
        public eventTest() {}
      }

      it('should enhance event sourcing handler with metadata', () => {
        const metadata = Reflect.getMetadata(AGGREGATE_EVENT_HANDLER_METADATA, Test.test)

        expect(metadata).toEqual({ event: Event })
      })

      it('should enhance event sourcing handler with domain event metadata', () => {
        expect(Reflect.getMetadata(DOMAIN_EVENT_ARGS_METADATA, Test, 'eventTest')).toBeDefined()
      })
    })
  })
})
