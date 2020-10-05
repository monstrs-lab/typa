import { Injectable }                    from '@nestjs/common'

import { DomainEventPriorityQueueStore } from '@typa/storage'

@Injectable()
export class DomainEventPublisher {
  constructor(private domainEventPriorityQueueStore: DomainEventPriorityQueueStore) {}

  publishDomainEvents = async (domainEvents): Promise<void> => {
    // eslint-disable-next-line no-restricted-syntax
    for (const domainEvent of domainEvents) {
      const flows = ['default']
      // eslint-disable-next-line no-restricted-syntax
      for (const flowName of flows) {
        // eslint-disable-next-line no-await-in-loop
        await this.domainEventPriorityQueueStore.enqueue({
          item: domainEvent.withoutState(),
          discriminator: flowName,
          priority: domainEvent.metadata.timestamp,
        })
      }
    }
  }
}
