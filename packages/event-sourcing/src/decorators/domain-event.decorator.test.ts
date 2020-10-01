import 'reflect-metadata'

import { DOMAIN_EVENT_ARGS_METADATA } from './domain-event.decorator'
import { DomainEvent }                from './domain-event.decorator'

describe('event-sourcing', () => {
  describe('decorators', () => {
    describe('domain-event', () => {
      class Test {
        public test(@DomainEvent event) {}
      }

      it('should enhance domain event with metadata', () => {
        const metadata = Reflect.getMetadata(DOMAIN_EVENT_ARGS_METADATA, Test, 'test')
        const key = Object.keys(metadata)[0]

        expect(metadata[key]).toEqual({
          index: 0,
        })
      })
    })
  })
})
