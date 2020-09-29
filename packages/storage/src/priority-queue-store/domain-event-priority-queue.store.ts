import { Injectable }                                   from '@nestjs/common'
import { Connection }                                   from 'typeorm'

import { DomainEventPriorityQueueItem }                 from './entities'
import { DomainEventPriorityQueue }                     from './entities'
import { PriorityQueueStore }                           from './priority-queue.store'
import { DomainEvent }                                  from './wolkenkit'
import { DomainEventData }                              from './wolkenkit'
import { ItemIdentifierWithClient }                     from './wolkenkit'
import { doesItemIdentifierWithClientMatchDomainEvent } from './wolkenkit'

@Injectable()
export class DomainEventPriorityQueueStore extends PriorityQueueStore<
  DomainEvent<DomainEventData>,
  ItemIdentifierWithClient
> {
  constructor(connection: Connection) {
    super(
      connection,
      DomainEventPriorityQueue,
      DomainEventPriorityQueueItem,
      doesItemIdentifierWithClientMatchDomainEvent,
      15_000
    )
  }
}
