import { Logger }                      from '@monstrs/logger'
import { Injectable }                  from '@nestjs/common'

import { AggregateMetadata }           from '../decorators'
import { EventSourcingHandlingMember } from './event-sourcing-handling.member'

@Injectable()
export class EventSourcingMetadataRegistry {
  private logger = new Logger(EventSourcingMetadataRegistry.name)

  private eventSourcingHandlers: Map<string, Map<string, EventSourcingHandlingMember>> = new Map()

  private aggregates: Map<string, AggregateMetadata> = new Map()

  addEventSourcingHandler(instanceName, event, handler: EventSourcingHandlingMember) {
    if (!this.eventSourcingHandlers.has(instanceName)) {
      this.eventSourcingHandlers.set(instanceName, new Map())
    }

    if (this.eventSourcingHandlers.get(instanceName)!.has(event)) {
      this.logger.warn(`Event sourcing handler for event ${event} already exists`)
    }

    this.eventSourcingHandlers.get(instanceName)!.set(event, handler)
  }

  getEventSourcingHandler(instanceName, event) {
    return this.eventSourcingHandlers.get(instanceName)?.get(event)
  }

  addAggregate(instanceName, metadata) {
    this.aggregates.set(instanceName, metadata)
  }

  getAggregate(instanceName) {
    return this.aggregates.get(instanceName)
  }
}
