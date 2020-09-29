import { Column, Entity, PrimaryColumn }  from 'typeorm'
import { DomainEvent as BaseDomainEvent } from 'wolkenkit/build/lib/common/elements/DomainEvent'

@Entity()
export class DomainEvent {
  @PrimaryColumn('uuid')
  aggregateId: string

  @PrimaryColumn()
  revision: number

  @Column('uuid')
  causationId: string

  @Column('uuid')
  correlationId: string

  @Column('bigint')
  timestamp: number

  @Column('jsonb')
  domainEvent: BaseDomainEvent<any>
}
