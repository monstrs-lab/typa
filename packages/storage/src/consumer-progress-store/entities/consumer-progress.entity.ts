import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class ConsumerProgress {
  @PrimaryColumn('varchar', { length: 64 })
  consumerId: string

  @PrimaryColumn('uuid')
  aggregateId: string

  @Column()
  revision: number

  @Column({ type: Number, nullable: true })
  isReplayingFrom: number | null

  @Column({ type: Number, nullable: true })
  isReplayingTo: number | null
}
