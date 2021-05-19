import { Injectable }                      from '@nestjs/common'

import { CommandPriorityQueueStore }       from '@typa/storage'

import { CommandHandlingMetadataRegistry } from '../metadata'
import { AbstractCommandBus }              from './abstract.command-bus'

@Injectable()
export class PriorityQueueCommandBus extends AbstractCommandBus {
  constructor(
    metadataRegistry: CommandHandlingMetadataRegistry,
    private priorityQueue: CommandPriorityQueueStore
  ) {
    super(metadataRegistry)
  }

  protected async handle(command) {
    await this.priorityQueue.enqueue({
      item: command,
      discriminator: command.aggregateIdentifier.id,
      priority: command.metadata.timestamp,
    })

    return { id: command.aggregateIdentifier.id }
  }
}
