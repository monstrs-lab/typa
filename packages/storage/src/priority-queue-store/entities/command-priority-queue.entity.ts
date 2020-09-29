import { Entity }        from 'typeorm'

import { PriorityQueue } from './priority-queue.entity'

@Entity()
export class CommandPriorityQueue extends PriorityQueue {}
