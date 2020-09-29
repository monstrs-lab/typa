import { Injectable }                                           from '@nestjs/common'
import { Connection }                                           from 'typeorm'

import { CommandPriorityQueueItem }                             from './entities'
import { CommandPriorityQueue }                                 from './entities'
import { PriorityQueueStore }                                   from './priority-queue.store'
import { CommandData }                                          from './wolkenkit'
import { CommandWithMetadata }                                  from './wolkenkit'
import { ItemIdentifierWithClient }                             from './wolkenkit'
import { doesItemIdentifierWithClientMatchCommandWithMetadata } from './wolkenkit'

@Injectable()
export class CommandPriorityQueueStore extends PriorityQueueStore<
  CommandWithMetadata<CommandData>,
  ItemIdentifierWithClient
> {
  constructor(connection: Connection) {
    super(
      connection,
      CommandPriorityQueue,
      CommandPriorityQueueItem,
      doesItemIdentifierWithClientMatchCommandWithMetadata,
      15_000
    )
  }
}
