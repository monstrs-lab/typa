import { cloneDeep }            from 'lodash'
import { v4 as uuid }           from 'uuid'

import { AggregateInstance }    from './aggregate.instance'
import { CommandWithMetadata }  from './wolkenkit'
import { DomainEvent }          from './wolkenkit'
import { DomainEventData }      from './wolkenkit'
import { DomainEventWithState } from './wolkenkit'
import { State }                from './wolkenkit'

export class EventSourcedAggregate<TState extends State> {
  constructor(
    private readonly aggregateInstance: AggregateInstance<TState>,
    private readonly command: CommandWithMetadata<any>
  ) {}

  id(): string {
    return this.aggregateInstance.aggregateIdentifier.id
  }

  isPristine(): boolean {
    return this.aggregateInstance.isPristine()
  }

  public async publishDomainEvent<TDomainEventData extends DomainEventData>(
    domainEventName: string,
    data: TDomainEventData,
    metadata: { tags: string[] } = { tags: [] }
  ): Promise<TState> {
    const domainEvent = new DomainEvent({
      contextIdentifier: this.aggregateInstance.contextIdentifier,
      aggregateIdentifier: this.aggregateInstance.aggregateIdentifier,
      name: domainEventName,
      data,
      id: uuid(),
      metadata: {
        causationId: this.command.id,
        correlationId: this.command.metadata.correlationId,
        timestamp: Date.now(),
        initiator: this.command.metadata.initiator,
        revision:
          this.aggregateInstance.revision + this.aggregateInstance.unstoredDomainEvents.length + 1,
        tags: metadata.tags,
      },
    })

    const previousState = cloneDeep(this.aggregateInstance.state)
    const nextState = await this.aggregateInstance.applyDomainEvent(domainEvent)

    const domainEventWithState = new DomainEventWithState({
      ...domainEvent,
      state: {
        previous: previousState,
        next: nextState,
      },
    })

    this.aggregateInstance.unstoredDomainEvents.push(domainEventWithState)

    return nextState
  }
}
