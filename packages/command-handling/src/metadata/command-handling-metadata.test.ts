/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { Module }                          from '@nestjs/common'
import { DiscoveryModule }                 from '@nestjs/core'
import { Test }                            from '@nestjs/testing'

import { ApplyEvent }                      from '../decorators'
import { Command }                         from '../decorators'
import { CommandHandler }                  from '../decorators'
import { CommandHandlingMetadataAccessor } from './command-handling-metadata.accessor'
import { CommandHandlingMetadataExplorer } from './command-handling-metadata.explorer'
import { CommandHandlingMetadataRegistry } from './command-handling-metadata.registry'

describe('command-handling', () => {
  describe('metadata', () => {
    @Module({
      imports: [DiscoveryModule],
      providers: [
        CommandHandlingMetadataAccessor,
        CommandHandlingMetadataExplorer,
        CommandHandlingMetadataRegistry,
      ],
    })
    class TestMetadataModule {}

    describe('command handler', () => {
      let module

      class TestCommand {
        constructor(public readonly id = 'test') {}
      }

      class TestEvent {
        constructor(public readonly id) {}
      }

      class TestAggregate {
        id: string

        @CommandHandler(TestCommand)
        testEvent(@Command command: TestCommand, @ApplyEvent apply) {
          apply(new TestEvent(command.id))
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

      it('should store command handler metadata', async () => {
        expect(
          module.get(CommandHandlingMetadataRegistry).getCommandHandler(TestCommand.name)
        ).toBeDefined()
      })

      it('should handle command', async () => {
        const handler = module
          .get(CommandHandlingMetadataRegistry)
          .getCommandHandler(TestCommand.name)

        await expect(handler.handle({}, { data: { id: 'test' } })).resolves.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'test',
            }),
          ])
        )
      })
    })
  })
})
