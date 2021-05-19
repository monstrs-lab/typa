import { Logger }                 from '@monstrs/logger'
import { cloneDeep }              from 'lodash'
import { v4 as uuid }             from 'uuid'

import { IEvent }                 from '@typa/event-handling'

import { DomainMetadataRegistry } from '../metadata'
import { SnapshotStrategy }       from './wolkenkit'
import { AggregateIdentifier }    from './wolkenkit'
import { CommandData }            from './wolkenkit'
import { CommandWithMetadata }    from './wolkenkit'
import { ContextIdentifier }      from './wolkenkit'
import { DomainEvent }            from './wolkenkit'
import { DomainEventData }        from './wolkenkit'
import { DomainEventWithState }   from './wolkenkit'
import { State }                  from './wolkenkit'
import { DomainEventStore }       from './wolkenkit'
import { Snapshot }               from './wolkenkit'
import { errors }                 from './wolkenkit'

export class AggregateInstance<TState extends State> {
  private readonly logger = new Logger(AggregateInstance.name)

  public unstoredDomainEvents: DomainEventWithState<DomainEventData, TState>[] = []

  public revision: number = 0

  protected constructor(
    public readonly contextIdentifier: ContextIdentifier,
    public readonly aggregateIdentifier: AggregateIdentifier,
    public state: TState,
    private readonly domainEventStore: DomainEventStore,
    private readonly metadataRegistry: DomainMetadataRegistry
  ) {}

  // eslint-disable-next-line no-shadow
  public static async create<TState extends State>(
    contextIdentifier: ContextIdentifier,
    aggregateIdentifier: AggregateIdentifier,
    domainEventStore: DomainEventStore,
    metadataRegistry: DomainMetadataRegistry,
    snapshotStrategy: SnapshotStrategy
  ) {
    const aggregateMetadata = metadataRegistry.getAggregate(aggregateIdentifier.name)

    if (!aggregateMetadata) {
      throw new errors.AggregateNotFound()
    }

    const initialState = aggregateMetadata.initialState as TState

    const aggregateInstance = new AggregateInstance<TState>(
      contextIdentifier,
      aggregateIdentifier,
      initialState,
      domainEventStore,
      metadataRegistry
    )

    const snapshot = await domainEventStore.getSnapshot<TState>({
      aggregateIdentifier,
    })

    let fromRevision = 1

    if (snapshot) {
      aggregateInstance.applySnapshot({ snapshot })
      fromRevision = snapshot.revision + 1
    }

    const domainEventStream = await domainEventStore.getReplayForAggregate({
      aggregateId: aggregateIdentifier.id,
      fromRevision,
    })

    const replayStartRevision = fromRevision - 1
    const replayStartTimestamp = Date.now()

    // eslint-disable-next-line no-restricted-syntax
    for await (const domainEvent of domainEventStream) {
      aggregateInstance.state = await aggregateInstance.applyDomainEvent(domainEvent)
      aggregateInstance.revision = domainEvent.metadata.revision
    }

    const replayDuration = Date.now() - replayStartTimestamp
    const replayedDomainEvents = aggregateInstance.revision - replayStartRevision

    if (
      replayedDomainEvents > 0 &&
      snapshotStrategy({
        latestSnapshot: snapshot,
        replayDuration,
        replayedDomainEvents,
      })
    ) {
      await domainEventStore.storeSnapshot({
        snapshot: {
          aggregateIdentifier,
          revision: aggregateInstance.revision,
          state: aggregateInstance.state,
        },
      })
    }

    return aggregateInstance
  }

  public async applyCommandEvents(
    command: CommandWithMetadata<CommandData>,
    commandEvents: IEvent[]
  ): Promise<DomainEventWithState<DomainEventData, TState>[]> {
    if (await this.domainEventStore.hasDomainEventsWithCausationId({ causationId: command.id })) {
      return []
    }

    // eslint-disable-next-line no-restricted-syntax
    for await (const event of commandEvents) {
      await this.publishDomainEvent(command, event.constructor.name, { ...event })
    }

    await this.storeCurrentAggregateState()

    const domainEvents: DomainEventWithState<DomainEventData, TState>[] = this.unstoredDomainEvents

    this.unstoredDomainEvents = []

    // eslint-disable-next-line no-restricted-syntax
    for await (const domainEvent of domainEvents) {
      this.state = await this.applyDomainEvent(domainEvent)

      this.revision = domainEvent.metadata.revision
    }

    return domainEvents
  }

  public isPristine(): boolean {
    return this.revision === 0
  }

  public applySnapshot({ snapshot }: { snapshot: Snapshot<TState> }): void {
    if (this.aggregateIdentifier.id !== snapshot.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch('Failed to apply snapshot. Aggregate id does not match.')
    }

    this.state = snapshot.state
    this.revision = snapshot.revision
  }

  public async storeCurrentAggregateState(): Promise<void> {
    if (this.unstoredDomainEvents.length === 0) {
      return
    }

    await this.domainEventStore.storeDomainEvents({
      domainEvents: this.unstoredDomainEvents.map(
        (domainEvent): DomainEvent<DomainEventData> => domainEvent.withoutState()
      ),
    })
  }

  public async applyDomainEvent<TDomainEventData extends DomainEventData>(
    domainEvent: DomainEvent<TDomainEventData>
  ): Promise<TState> {
    if (domainEvent.contextIdentifier.name !== this.contextIdentifier.name) {
      throw new errors.IdentifierMismatch('Context name does not match.')
    }
    if (domainEvent.aggregateIdentifier.name !== this.aggregateIdentifier.name) {
      throw new errors.IdentifierMismatch('Aggregate name does not match.')
    }
    if (domainEvent.aggregateIdentifier.id !== this.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch('Aggregate id does not match.')
    }

    const eventSourcingHandler = this.metadataRegistry.getAggregateEventHandler(
      this.aggregateIdentifier.name,
      domainEvent.name
    )

    if (!eventSourcingHandler) {
      this.logger.debug(
        `Event sourcing handler not found for '${domainEvent.name}' in '${this.contextIdentifier.name}.${this.aggregateIdentifier.name}'.`
      )

      return this.state
    }

    const newStatePartial = await eventSourcingHandler.handle(this.state, domainEvent)

    return { ...this.state, ...newStatePartial }
  }

  protected async publishDomainEvent<TDomainEventData extends DomainEventData>(
    command: CommandWithMetadata<CommandData>,
    domainEventName: string,
    data: TDomainEventData,
    metadata: { tags: string[] } = { tags: [] }
  ): Promise<TState> {
    const domainEvent = new DomainEvent({
      contextIdentifier: this.contextIdentifier,
      aggregateIdentifier: this.aggregateIdentifier,
      name: domainEventName,
      data,
      id: uuid(),
      metadata: {
        causationId: command.id,
        correlationId: command.metadata.correlationId,
        timestamp: Date.now(),
        initiator: command.metadata.initiator,
        revision: this.revision + this.unstoredDomainEvents.length + 1,
        tags: metadata.tags,
      },
    })

    const previousState = cloneDeep(this.state)
    const nextState = await this.applyDomainEvent(domainEvent)

    const domainEventWithState = new DomainEventWithState({
      ...domainEvent,
      state: {
        previous: previousState,
        next: nextState,
      },
    })

    this.unstoredDomainEvents.push(domainEventWithState)

    return nextState
  }
}
