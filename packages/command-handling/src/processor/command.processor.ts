import { Injectable }                      from '@nestjs/common'
import { AssertionError }                  from 'assert'
import { Value }                           from 'validate-value'
import { cloneDeep }                       from 'lodash'
import { v4 as uuid }                      from 'uuid'

import { DomainEventPublisher }            from '@typa/event-handling'
import { Repository }                      from '@typa/event-sourcing'
import { Logger }                          from '@typa/logger'
import { CommandPriorityQueueStore }       from '@typa/storage'

import { CommandHandlerNotFoundException } from '../exceptions'
import { CommandHandlingMetadataRegistry } from '../metadata'
import { DomainEvent }                     from './wolkenkit'
import { DomainEventWithState }            from './wolkenkit'
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

      const handleCommandPromise = this.handleCommand(command, aggregateInstance)

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

  protected async handleCommand(command, aggregateInstance) {
    const commandHandler = this.metadataRegistry.getCommandHandler(command.name)

    if (!commandHandler) {
      throw new CommandHandlerNotFoundException(command.name)
    }

    try {
      const clonedCommand = cloneDeep(command)

      // eslint-disable-next-line no-restricted-syntax
      const handledEvents = await commandHandler.handle(aggregateInstance.state, clonedCommand)

      return aggregateInstance.applyCommandEvents(command, handledEvents)
    } catch (error) {
      return [this.buildCommandHandleErrorDomainEvent(error, command, aggregateInstance)]
    }
  }

  protected buildCommandHandleErrorDomainEvent(error, command, aggregateInstance) {
    const errorType = error instanceof AssertionError ? 'Rejected' : 'Failed'

    const domainEventName = `${command.name}${errorType}`

    const domainEvent = new DomainEvent({
      contextIdentifier: aggregateInstance.contextIdentifier,
      aggregateIdentifier: aggregateInstance.aggregateIdentifier,
      name: domainEventName,
      data: {
        reason: error.message,
      },
      id: uuid(),
      metadata: {
        causationId: command.id,
        correlationId: command.metadata.correlationId,
        timestamp: Date.now(),
        initiator: command.metadata.initiator,
        revision: aggregateInstance.revision + aggregateInstance.unstoredDomainEvents.length + 1,
        tags: [],
      },
    })

    const previousState = cloneDeep(aggregateInstance.state)
    const nextState = cloneDeep(aggregateInstance.state)

    return new DomainEventWithState({
      ...domainEvent,
      state: {
        previous: previousState,
        next: nextState,
      },
    })
  }
}
