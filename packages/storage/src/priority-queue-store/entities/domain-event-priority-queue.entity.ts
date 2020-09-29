import { Entity }        from 'typeorm'

import { PriorityQueue } from './priority-queue.entity'

@Entity()
export class DomainEventPriorityQueue extends PriorityQueue {}
