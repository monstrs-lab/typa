import { cloneDeep }                     from 'lodash'

import { EventSourcingMetadataRegistry } from '../metadata'
import { EventSourcedAggregate }         from './event-sourced.aggregate'
import { SnapshotStrategy }              from './wolkenkit'
import { AggregateIdentifier }           from './wolkenkit'
import { CommandData }                   from './wolkenkit'
import { CommandWithMetadata }           from './wolkenkit'
import { ContextIdentifier }             from './wolkenkit'
import { DomainEvent }                   from './wolkenkit'
import { DomainEventData }               from './wolkenkit'
import { DomainEventWithState }          from './wolkenkit'
import { State }                         from './wolkenkit'
import { DomainEventStore }              from './wolkenkit'
import { Snapshot }                      from './wolkenkit'
import { errors }                        from './wolkenkit'

export class AggregateInstance<TState extends State> {
  public unstoredDomainEvents: DomainEventWithState<DomainEventData, TState>[] = []

  public revision: number = 0

  protected constructor(
    public readonly contextIdentifier: ContextIdentifier,
    public readonly aggregateIdentifier: AggregateIdentifier,
    public state: TState,
    private readonly domainEventStore: DomainEventStore,
    private readonly metadataRegistry: EventSourcingMetadataRegistry
  ) {}

  // eslint-disable-next-line no-shadow
  public static async create<TState extends State>(
    contextIdentifier: ContextIdentifier,
    aggregateIdentifier: AggregateIdentifier,
    domainEventStore: DomainEventStore,
    metadataRegistry: EventSourcingMetadataRegistry,
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

  public async handleCommand(
    command: CommandWithMetadata<CommandData>,
    commandHandler
  ): Promise<DomainEventWithState<DomainEventData, TState>[]> {
    if (command.contextIdentifier.name !== this.contextIdentifier.name) {
      throw new errors.IdentifierMismatch('Context name does not match.')
    }
    if (command.aggregateIdentifier.name !== this.aggregateIdentifier.name) {
      throw new errors.IdentifierMismatch('Aggregate name does not match.')
    }
    if (command.aggregateIdentifier.id !== this.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch('Aggregate id does not match.')
    }

    if (await this.domainEventStore.hasDomainEventsWithCausationId({ causationId: command.id })) {
      return []
    }

    const aggregate = new EventSourcedAggregate(this, command)

    let domainEvents: DomainEventWithState<DomainEventData, TState>[]

    try {
      const clonedCommand = cloneDeep(command)

      // eslint-disable-next-line no-restricted-syntax
      for await (const event of await commandHandler(this.state, clonedCommand)) {
        await aggregate.publishDomainEvent(event.constructor.name, { ...event })
      }

      await this.storeCurrentAggregateState()

      domainEvents = this.unstoredDomainEvents
    } catch (error) {
      switch (error.code) {
        case errors.CommandNotAuthorized.code:
        case errors.CommandRejected.code: {
          await aggregate.publishDomainEvent(`${command.name}Rejected`, {
            reason: error.message,
          })
          break
        }
        default: {
          await aggregate.publishDomainEvent(`${command.name}Failed`, {
            reason: error.message,
          })
        }
      }

      domainEvents = [this.unstoredDomainEvents[this.unstoredDomainEvents.length - 1]]
    }

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

    const eventSourcingHandler = this.metadataRegistry.getEventSourcingHandler(
      this.aggregateIdentifier.name,
      domainEvent.name
    )

    if (!eventSourcingHandler) {
      if (domainEvent.name.endsWith('Rejected') || domainEvent.name.endsWith('Failed')) {
        return this.state
      }

      throw new errors.DomainEventUnknown(
        `Failed to apply unknown domain event '${domainEvent.name}' in '${this.contextIdentifier.name}.${this.aggregateIdentifier.name}'.`
      )
    }

    const newStatePartial = await eventSourcingHandler.handle(this.state, domainEvent)

    return { ...this.state, ...newStatePartial }
  }
}
