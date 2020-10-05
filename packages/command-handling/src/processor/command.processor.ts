import { Injectable }                      from '@nestjs/common'
import { Value }                           from 'validate-value'

import { DomainEventPublisher }            from '@typa/event-handling'
import { Repository }                      from '@typa/event-sourcing'
import { Logger }                          from '@typa/logger'
import { CommandPriorityQueueStore }       from '@typa/storage'

import { CommandHandlingMetadataRegistry } from '../metadata'
import { errors }                          from './wolkenkit'
import { getCommandWithMetadataSchema }    from './wolkenkit'
import { acknowledgeCommand }              from './wolkenkit'
import { fetchCommand }                    from './wolkenkit'
import { keepRenewingLock }                from './wolkenkit'

@Injectable()
export class CommandProcessor {
  private readonly logger = new Logger(CommandProcessor.name)

  constructor(
    private readonly commandPriorityQueueStore: CommandPriorityQueueStore,
    private readonly metadataRegistry: CommandHandlingMetadataRegistry,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly repository: Repository
  ) {}

  async processCommand() {
    const priorityQueue = {
      store: this.commandPriorityQueueStore,
      renewalInterval: 5000,
    }

    const { command, metadata } = await fetchCommand({ priorityQueue })

    this.logger.debug('Fetched and locked command for domain server.', {
      itemIdentifier: command.getItemIdentifier(),
      metadata,
    })

    try {
      try {
        new Value(getCommandWithMetadataSchema()).validate(command, { valueName: 'command' })
      } catch (error) {
        throw new errors.CommandMalformed(error.message)
      }

      const aggregateInstance = await this.repository.getAggregateInstance(
        command.contextIdentifier,
        command.aggregateIdentifier
      )

      const commandHandler = this.metadataRegistry.getCommandHandler(command.name)

      const handleCommandPromise = aggregateInstance.handleCommand(command, commandHandler)

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ;(async (): Promise<void> => {
        await keepRenewingLock({
          command,
          handleCommandPromise,
          priorityQueue,
          token: metadata.token,
        })
      })()

      const domainEvents = await handleCommandPromise

      await this.domainEventPublisher.publishDomainEvents(domainEvents)
    } catch (error) {
      this.logger.error('Failed to handle command: %s', error, { command })
    } finally {
      await acknowledgeCommand({ command, token: metadata.token, priorityQueue })

      this.logger.debug('Processed and acknowledged command.', {
        itemIdentifier: command.getItemIdentifier(),
        metadata,
      })
    }
  }
}
