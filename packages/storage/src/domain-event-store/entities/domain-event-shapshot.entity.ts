import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class DomainEventSnapshot {
  @PrimaryColumn('uuid')
  aggregateId: string

  @PrimaryColumn()
  revision: number

  @Column('jsonb')
  state: any
}
