import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class ConsumerProgress {
  @PrimaryColumn('varchar', { length: 64 })
  consumerId: string

  @PrimaryColumn('uuid')
  aggregateId: string

  @Column()
  revision: number

  @Column({ nullable: true })
  isReplayingFrom: number

  @Column({ nullable: true })
  isReplayingTo: number
}
