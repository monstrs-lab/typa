/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { Module }                        from '@nestjs/common'
import { DiscoveryModule }               from '@nestjs/core'
import { Test }                          from '@nestjs/testing'

import { Aggregate }                     from '../decorators'
import { EventSourcingHandler }          from '../decorators'
import { DomainEvent }                   from '../decorators'
import { EventSourcingMetadataAccessor } from './event-sourcing-metadata.accessor'
import { EventSourcingMetadataExplorer } from './event-sourcing-metadata.explorer'
import { EventSourcingMetadataRegistry } from './event-sourcing-metadata.registry'

describe('event-sourcing', () => {
  describe('metadata', () => {
    @Module({
      imports: [DiscoveryModule],
      providers: [
        EventSourcingMetadataAccessor,
        EventSourcingMetadataExplorer,
        EventSourcingMetadataRegistry,
      ],
    })
    class TestMetadataModule {}

    describe('aggregate', () => {
      let module

      @Aggregate()
      class TestAggregate {
        initial = 'test'
      }

      beforeEach(async () => {
        module = await Test.createTestingModule({
          imports: [TestMetadataModule],
          providers: [TestAggregate],
        }).compile()

        await module.init()
      })

      afterEach(async () => {
        await module.close()
      })

      it('should store aggregate metadata', async () => {
        expect(
          module.get(EventSourcingMetadataRegistry).getAggregate(TestAggregate.name)
        ).toBeDefined()
      })

      it('should store aggregate metadata with initial state', async () => {
        expect(module.get(EventSourcingMetadataRegistry).getAggregate(TestAggregate.name)).toEqual({
          initialState: {
            initial: 'test',
          },
        })
      })
    })

    describe('event sourcing handler', () => {
      let module

      class TestEvent {
        constructor(public readonly id = 'test') {}
      }

      @Aggregate()
      class TestAggregate {
        id = 'initial'

        @EventSourcingHandler(TestEvent)
        testEvent(@DomainEvent event: TestEvent) {
          this.id = event.id
        }
      }

      beforeEach(async () => {
        module = await Test.createTestingModule({
          imports: [TestMetadataModule],
          providers: [TestAggregate],
        }).compile()

        await module.init()
      })

      afterEach(async () => {
        await module.close()
      })

      it('should store event sourcing handler metadata', async () => {
        expect(
          module
            .get(EventSourcingMetadataRegistry)
            .getEventSourcingHandler(TestAggregate.name, TestEvent.name)
        ).toBeDefined()
      })

      it('should event sourcing handler handle event', async () => {
        const handler = module
          .get(EventSourcingMetadataRegistry)
          .getEventSourcingHandler(TestAggregate.name, TestEvent.name)

        await expect(handler.handle({}, { data: { id: 'test' } })).resolves.toEqual({
          id: 'test',
        })
      })
    })
  })
})
