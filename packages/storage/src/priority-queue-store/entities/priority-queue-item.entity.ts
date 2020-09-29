import { Column, Index }         from 'typeorm'
import { Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class PriorityQueueItem {
  @Index()
  @PrimaryColumn('varchar', { length: 100 })
  discriminator: string

  @PrimaryColumn()
  indexInQueue: number

  @Column('bigint')
  priority: number

  @Column('jsonb')
  item: any
}
