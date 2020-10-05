import { DomainEvent }     from 'wolkenkit/build/lib/common/elements/DomainEvent'
import { DomainEventData } from 'wolkenkit/build/lib/common/elements/DomainEventData'

import { IEvent }          from '../interfaces'

export type EventContextHandlingMember = (...args: Array<IEvent>) => Promise<void> | void

export class EventHandlingMember {
  constructor(private event: IEvent, private handler: EventContextHandlingMember) {}

  isRelevant(itemIdentifier, fullyQualifiedName?) {
    return itemIdentifier.name === this.event.name
  }

  handle<TDomainEventData extends DomainEventData>(
    domainEvent: DomainEvent<TDomainEventData>
  ): Promise<void> | void {
    const { event: Event, handler } = this

    const event = Object.assign(new Event(), domainEvent.data)

    return handler(event)
  }
}
