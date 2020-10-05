import { Injectable }                    from '@nestjs/common'
import { Value }                         from 'validate-value'
import { errors }                        from 'wolkenkit/build/lib/common/errors'
import { getDomainEventSchema }          from 'wolkenkit/build/lib/common/schemas/getDomainEventSchema'
import { acknowledgeDomainEvent }        from 'wolkenkit/build/lib/runtimes/singleProcess/processes/main/flow/acknowledgeDomainEvent'
import { fetchDomainEvent }              from 'wolkenkit/build/lib/runtimes/singleProcess/processes/main/flow/fetchDomainEvent'
import { keepRenewingLock }              from 'wolkenkit/build/lib/runtimes/singleProcess/processes/main/flow/keepRenewingLock'

import { Logger }                        from '@typa/logger'
import { ConsumerProgressStore }         from '@typa/storage'
import { DomainEventStore }              from '@typa/storage'
import { DomainEventPriorityQueueStore } from '@typa/storage'

import { EventHandlingMetadataRegistry } from '../metadata'

@Injectable()
export class DomainEventProcessor {
  private readonly logger = new Logger(DomainEventProcessor.name)

  constructor(
    private metadataRegistry: EventHandlingMetadataRegistry,
    private consumerProgressStore: ConsumerProgressStore,
    private domainEventStore: DomainEventStore,
    private domainEventPriorityQueueStore: DomainEventPriorityQueueStore
  ) {}

  requestReplay = async ({
    flowName,
    aggregateIdentifier,
    from,
    to,
  }: {
    flowName: string
    aggregateIdentifier: any
    contextIdentifier: any
    from: number
    to: number
  }): Promise<void> => {
    const domainEventStream = await this.domainEventStore.getReplayForAggregate({
      aggregateId: aggregateIdentifier.id,
      fromRevision: from,
      toRevision: to,
    })

    // eslint-disable-next-line no-restricted-syntax
    for await (const domainEvent of domainEventStream) {
      await this.domainEventPriorityQueueStore.enqueue({
        item: domainEvent,
        discriminator: flowName,
        priority: (domainEvent as any).metadata.timestamp,
      })
    }
  }

  issueCommand = async ({ command }: { command: any }): Promise<void> => {
    throw new Error('Issue command')
  }

  async processDomainEvent() {
    const priorityQueue = {
      store: this.domainEventPriorityQueueStore,
      renewalInterval: 5_000,
    }

    const { domainEvent, metadata } = await fetchDomainEvent({ priorityQueue })
    const flowName = metadata.discriminator

    this.logger.debug('Fetched and locked domain event for flow execution.', {
      itemIdentifier: domainEvent.getItemIdentifier(),
      metadata,
    })

    try {
      try {
        new Value(getDomainEventSchema()).validate(domainEvent, { valueName: 'domainEvent' })
      } catch (ex) {
        throw new errors.DomainEventMalformed(ex.message)
      }

      const flowPromise = this.executeFlow(domainEvent, flowName)

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ;(async (): Promise<void> => {
        await keepRenewingLock({ flowName, flowPromise, priorityQueue, token: metadata.token })
      })()

      const howToProceed = await flowPromise

      switch (howToProceed) {
        case 'acknowledge': {
          await acknowledgeDomainEvent({ flowName, token: metadata.token, priorityQueue })

          this.logger.debug('Acknowledged domain event.', {
            itemIdentifier: domainEvent.getItemIdentifier(),
            metadata,
          })
          break
        }
        case 'defer': {
          await priorityQueue.store.defer({
            discriminator: flowName,
            priority: domainEvent.metadata.timestamp,
            token: metadata.token,
          })

          this.logger.debug('Skipped and deferred domain event.', {
            itemIdentifier: domainEvent.getItemIdentifier(),
            metadata,
          })
          break
        }
        default: {
          throw new errors.InvalidOperation()
        }
      }
    } catch (error) {
      this.logger.error('Failed to handle domain event: %s%.', error, { domainEvent })

      await acknowledgeDomainEvent({ flowName, token: metadata.token, priorityQueue })
    }
  }

  private async executeFlow(domainEvent, flowName) {
    const {
      revision: latestHandledRevision,
      isReplaying,
    } = await this.consumerProgressStore.getProgress({
      consumerId: flowName,
      aggregateIdentifier: domainEvent.aggregateIdentifier,
    })

    if (latestHandledRevision >= domainEvent.metadata.revision) {
      return 'acknowledge'
    }

    const flowDefinition = {
      replayPolicy: 'aalwaysl',
    }

    if (latestHandledRevision < domainEvent.metadata.revision - 1) {
      switch (flowDefinition.replayPolicy) {
        case 'never': {
          break
        }
        case 'on-demand': {
          return 'defer'
        }
        case 'always': {
          if (!isReplaying) {
            const from = latestHandledRevision + 1
            const to = domainEvent.metadata.revision - 1

            await this.requestReplay({
              flowName,
              contextIdentifier: domainEvent.contextIdentifier,
              aggregateIdentifier: domainEvent.aggregateIdentifier,
              from,
              to,
            })

            await this.consumerProgressStore.setIsReplaying({
              consumerId: flowName,
              aggregateIdentifier: domainEvent.aggregateIdentifier,
              isReplaying: { from, to },
            })
          }

          return 'defer'
        }
        default: {
          throw new errors.InvalidOperation()
        }
      }
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const handler of this.metadataRegistry.getEventHandlers()) {
      if (
        handler.isRelevant(domainEvent.getItemIdentifier(), domainEvent.getFullyQualifiedName())
      ) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await handler.handle(domainEvent)
        } catch (error) {
          this.logger.error('The flow handler %s% %s%', flowName, error)

          throw error
        }
      }
    }

    await this.consumerProgressStore.setProgress({
      consumerId: flowName,
      aggregateIdentifier: domainEvent.aggregateIdentifier,
      revision: domainEvent.metadata.revision,
    })

    if (isReplaying && isReplaying.to === domainEvent.metadata.revision) {
      await this.consumerProgressStore.setIsReplaying({
        consumerId: flowName,
        aggregateIdentifier: domainEvent.aggregateIdentifier,
        isReplaying: false,
      })
    }

    return 'acknowledge'
  }
}
