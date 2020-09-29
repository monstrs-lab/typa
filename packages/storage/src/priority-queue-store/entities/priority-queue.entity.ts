import { Column, Index }         from 'typeorm'
import { Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class PriorityQueue {
  @PrimaryColumn('varchar', { length: 100 })
  discriminator: string

  @Index()
  @Column()
  indexInPriorityQueue: number

  @Column('bigint', { nullable: true })
  lockUntil: number

  @Column('uuid', { nullable: true })
  lockToken: string
}
