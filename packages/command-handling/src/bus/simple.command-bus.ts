import { Injectable }                      from '@nestjs/common'
import { cloneDeep }                       from 'lodash'

import { Repository }                      from '@typa/domain'
import { SimpleDomainEventPublisher }      from '@typa/event-handling'

import { CommandHandlingMetadataRegistry } from '../metadata'
import { AbstractCommandBus }              from './abstract.command-bus'

@Injectable()
export class SimpleCommandBus extends AbstractCommandBus {
  constructor(
    metadataRegistry: CommandHandlingMetadataRegistry,
    private readonly repository: Repository,
    private readonly domainEventPublisher: SimpleDomainEventPublisher
  ) {
    super(metadataRegistry)
  }

  protected async handle(command) {
    const commandHandler = this.getCommandHandler(command.name)

    const aggregateInstance = await this.repository.getAggregateInstance(
      command.contextIdentifier,
      command.aggregateIdentifier
    )

    const handledEvents = await commandHandler.handle(
      aggregateInstance.state,
      cloneDeep(command),
      this.repository
    )

    const domainEvents = await aggregateInstance.applyCommandEvents(command, handledEvents)

    await this.domainEventPublisher.publishDomainEvents(domainEvents)

    return { id: command.aggregateIdentifier.id }
  }
}
