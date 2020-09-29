import streamifyArray                       from 'stream-array'
import { Injectable }                       from '@nestjs/common'
import { PassThrough, Readable }            from 'stream'
import { Connection, SelectQueryBuilder }   from 'typeorm'

import { DomainEventSnapshot }              from './entities'
import { DomainEvent as DomainEventEntity } from './entities'
import { AggregateIdentifier }              from './wolkenkit'
import { DomainEvent }                      from './wolkenkit'
import { DomainEventData }                  from './wolkenkit'
import { State }                            from './wolkenkit'
import { BaseDomainEventStore }             from './wolkenkit'
import { Snapshot }                         from './wolkenkit'
import { errors }                           from './wolkenkit'
import { omitDeepBy }                       from './wolkenkit'

@Injectable()
export class DomainEventStore implements BaseDomainEventStore {
  constructor(private readonly connection: Connection) {}

  public async getLastDomainEvent<TDomainEventData extends DomainEventData>({
    aggregateIdentifier,
  }: {
    aggregateIdentifier: AggregateIdentifier
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const domainEvent = await this.connection.getRepository(DomainEventEntity).findOne({
      where: {
        aggregateId: aggregateIdentifier.id,
      },
      order: {
        revision: 'DESC',
      },
    })

    if (!domainEvent) {
      return undefined
    }

    return new DomainEvent<TDomainEventData>(domainEvent.domainEvent)
  }

  public async getDomainEventsByCausationId({
    causationId,
  }: {
    causationId: string
  }): Promise<Readable> {
    const qb = this.connection
      .getRepository(DomainEventEntity)
      .createQueryBuilder('event')
      .where('event."causationId" = :causation', { causation: causationId })

    return this.streamDomainEvents(qb)
  }

  public async hasDomainEventsWithCausationId({
    causationId,
  }: {
    causationId: string
  }): Promise<boolean> {
    const rows = await this.connection.getRepository(DomainEventEntity).find({
      where: {
        causationId,
      },
    })

    return rows.length !== 0
  }

  public async getDomainEventsByCorrelationId({
    correlationId,
  }: {
    correlationId: string
  }): Promise<Readable> {
    const qb = this.connection
      .getRepository(DomainEventEntity)
      .createQueryBuilder('event')
      .where('event."correlationId" = :correlation', { correlation: correlationId })

    return this.streamDomainEvents(qb)
  }

  public async getReplay({ fromTimestamp = 0 } = {}): Promise<Readable> {
    if (fromTimestamp < 0) {
      throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`)
    }

    const qb = this.connection
      .getRepository(DomainEventEntity)
      .createQueryBuilder('event')
      .where('event."timestamp" >= :timestamp', { timestamp: fromTimestamp })
      .orderBy('event."aggregateId"')
      .addOrderBy('event."revision"')

    return this.streamDomainEvents(qb)
  }

  public async getReplayForAggregate({
    aggregateId,
    fromRevision = 1,
    toRevision = 2 ** 31 - 1,
  }: {
    aggregateId: string
    fromRevision?: number
    toRevision?: number
  }): Promise<Readable> {
    if (fromRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'fromRevision' must be at least 1.`)
    }

    if (toRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be at least 1.`)
    }

    if (fromRevision > toRevision) {
      throw new errors.ParameterInvalid(
        `Parameter 'toRevision' must be greater or equal to 'fromRevision'.`
      )
    }

    const qb = this.connection
      .getRepository(DomainEventEntity)
      .createQueryBuilder('event')
      .where('event."aggregateId" = :aggregate', { aggregate: aggregateId })
      .andWhere('event."revision" >= :fromrevision', { fromrevision: fromRevision })
      .andWhere('event."revision" <= :torevision', { torevision: toRevision })
      .orderBy('event."revision"')

    return this.streamDomainEvents(qb)
  }

  protected async streamDomainEvents(qb: SelectQueryBuilder<DomainEventEntity>): Promise<Readable> {
    const passThrough = new PassThrough({ objectMode: true })

    const domainEventStream = this.connection.options.type.includes('sqlite')
      ? streamifyArray(await qb.getMany())
      : await qb.stream()

    // eslint-disable-next-line one-var
    let onData: (data: any) => void, onEnd: () => void, onError: (err: Error) => void

    const unsubscribe = (): void => {
      domainEventStream.removeListener('data', onData)
      domainEventStream.removeListener('end', onEnd)
      domainEventStream.removeListener('error', onError)
    }

    onData = (data: any): void => {
      const domainEvent = new DomainEvent<DomainEventData>(data.domainEvent)

      passThrough.write(domainEvent)
    }

    onEnd = (): void => {
      unsubscribe()
      passThrough.end()
    }

    onError = (err: Error): void => {
      unsubscribe()
      passThrough.emit('error', err)
      passThrough.end()
    }

    domainEventStream.on('data', onData)
    domainEventStream.on('end', onEnd)
    domainEventStream.on('error', onError)

    return passThrough
  }

  public async storeDomainEvents<TDomainEventData extends DomainEventData>({
    domainEvents,
  }: {
    domainEvents: DomainEvent<TDomainEventData>[]
  }): Promise<void> {
    if (domainEvents.length === 0) {
      throw new errors.ParameterInvalid('Domain events are missing.')
    }

    try {
      await this.connection.manager.insert(
        DomainEventEntity,
        domainEvents.map((domainEvent) => ({
          aggregateId: domainEvent.aggregateIdentifier.id,
          revision: domainEvent.metadata.revision,
          causationId: domainEvent.metadata.causationId,
          correlationId: domainEvent.metadata.correlationId,
          timestamp: domainEvent.metadata.timestamp,
          domainEvent: omitDeepBy(domainEvent, (value): boolean => value === undefined),
        }))
      )
    } catch (ex) {
      if (ex.code === '23505' && ex.detail?.startsWith('Key ("aggregateId", revision)')) {
        throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.')
      } else if (ex.errno === 19 && ex.code === 'SQLITE_CONSTRAINT') {
        throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.')
      }

      throw ex
    }
  }

  public async getSnapshot<TState extends State>({
    aggregateIdentifier,
  }: {
    aggregateIdentifier: AggregateIdentifier
  }): Promise<Snapshot<TState> | undefined> {
    const snapshotRepository = this.connection.getRepository(DomainEventSnapshot)

    const snapshot = await snapshotRepository.findOne({
      where: {
        aggregateId: aggregateIdentifier.id,
      },
      order: {
        revision: 'DESC',
      },
    })

    if (!snapshot) {
      return
    }

    // eslint-disable-next-line consistent-return
    return {
      aggregateIdentifier,
      revision: snapshot.revision,
      state: snapshot.state,
    }
  }

  public async storeSnapshot({ snapshot }: { snapshot: Snapshot<State> }): Promise<void> {
    const domainEventSnapshot = new DomainEventSnapshot()

    domainEventSnapshot.aggregateId = snapshot.aggregateIdentifier.id
    domainEventSnapshot.revision = snapshot.revision
    domainEventSnapshot.state = omitDeepBy(snapshot.state, (value): boolean => value === undefined)

    await this.connection
      .createQueryBuilder()
      .insert()
      .into(DomainEventSnapshot)
      .values(domainEventSnapshot)
      .onConflict('DO NOTHING')
      .execute()
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async destroy(): Promise<void> {}
}
