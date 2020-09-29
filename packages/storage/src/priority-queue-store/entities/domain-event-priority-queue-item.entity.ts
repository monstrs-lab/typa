import { Entity }            from 'typeorm'

import { PriorityQueueItem } from './priority-queue-item.entity'

@Entity()
export class DomainEventPriorityQueueItem extends PriorityQueueItem {}
