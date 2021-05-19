import { Logger }                       from '@monstrs/logger'
import { Injectable }                   from '@nestjs/common'

import { AggregateMetadata }            from '../decorators'
import { AggregateEventHandlingMember } from './aggregate-event-handling.member'

@Injectable()
export class DomainMetadataRegistry {
  private logger = new Logger(DomainMetadataRegistry.name)

  private aggregateEventHandlers: Map<string, Map<string, AggregateEventHandlingMember>> = new Map()

  private aggregates: Map<string, AggregateMetadata> = new Map()

  addAggregateEventHandler(instanceName, event, handler: AggregateEventHandlingMember) {
    if (!this.aggregateEventHandlers.has(instanceName)) {
      this.aggregateEventHandlers.set(instanceName, new Map())
    }

    if (this.aggregateEventHandlers.get(instanceName)!.has(event)) {
      this.logger.warn(`Event sourcing handler for event ${event} already exists`)
    }

    this.aggregateEventHandlers.get(instanceName)!.set(event, handler)
  }

  getAggregateEventHandler(instanceName, event) {
    return this.aggregateEventHandlers.get(instanceName)?.get(event)
  }

  addAggregate(instanceName, metadata) {
    this.aggregates.set(instanceName, metadata)
  }

  getAggregate(instanceName) {
    return this.aggregates.get(instanceName)
  }
}
