import { DomainEvent }     from 'wolkenkit/build/lib/common/elements/DomainEvent'
import { DomainEventData } from 'wolkenkit/build/lib/common/elements/DomainEventData'
import { State }           from 'wolkenkit/build/lib/common/elements/State'

import { IEvent }          from '@typa/event-handling'

export type EventSourcingContextHandlingMember = <TState extends State>(
  ...args: Array<TState | IEvent>
) => Promise<TState> | TState

export class EventSourcingHandlingMember {
  constructor(private event: IEvent, private handler: EventSourcingContextHandlingMember) {}

  handle<TState extends State, TDomainEventData extends DomainEventData>(
    state: TState,
    domainEvent: DomainEvent<TDomainEventData>
  ): Promise<TState> | TState {
    const { event: Event, handler } = this

    const event = Object.assign(new Event(), domainEvent.data)

    return handler<TState>(state, event)
  }
}
