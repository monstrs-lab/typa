import { Injectable }                    from '@nestjs/common'
import { Logger }                        from '@monstrs/logger'

import { EventHandlingMetadataRegistry } from '../metadata'

@Injectable()
export class SimpleDomainEventPublisher {
  private readonly logger = new Logger(SimpleDomainEventPublisher.name)

  constructor(private metadataRegistry: EventHandlingMetadataRegistry) {}

  publishDomainEvents = async (domainEvents): Promise<void> => {
    // eslint-disable-next-line no-restricted-syntax
    for (const domainEvent of domainEvents) {
      // eslint-disable-next-line no-restricted-syntax
      for (const handler of this.metadataRegistry.getEventHandlers()) {
        if (
          handler.isRelevant(domainEvent.getItemIdentifier(), domainEvent.getFullyQualifiedName())
        ) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await handler.handle(domainEvent)
          } catch (error) {
            this.logger.error(error)

            throw error
          }
        }
      }
    }
  }
}
