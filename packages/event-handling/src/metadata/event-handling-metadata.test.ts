/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { Module }                        from '@nestjs/common'
import { DiscoveryModule }               from '@nestjs/core'
import { Test }                          from '@nestjs/testing'

import { EventHandler }                  from '../decorators'
import { Event }                         from '../decorators'
import { EventHandlingMetadataAccessor } from './event-handling-metadata.accessor'
import { EventHandlingMetadataExplorer } from './event-handling-metadata.explorer'
import { EventHandlingMetadataRegistry } from './event-handling-metadata.registry'

describe('event-handling', () => {
  describe('metadata', () => {
    @Module({
      imports: [DiscoveryModule],
      providers: [
        EventHandlingMetadataAccessor,
        EventHandlingMetadataExplorer,
        EventHandlingMetadataRegistry,
      ],
    })
    class TestMetadataModule {}

    describe('event handler', () => {
      let module

      class TestEvent {
        constructor(public readonly id = 'test') {}
      }

      class TestTarget {
        @EventHandler(TestEvent)
        testEvent(@Event event: TestEvent) {}
      }

      beforeEach(async () => {
        module = await Test.createTestingModule({
          imports: [TestMetadataModule],
          providers: [TestTarget],
        }).compile()

        await module.init()
      })

      afterEach(async () => {
        await module.close()
      })

      it('should store event handler metadata', async () => {
        expect(
          module.get(EventHandlingMetadataRegistry).getEventHandlers(TestEvent.name)
        ).toBeDefined()
      })
    })
  })
})
