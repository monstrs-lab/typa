import { SetMetadata, applyDecorators }    from '@nestjs/common'

import { IEvent }                          from '@typa/event-handling'

import { DomainEventHandlerParamType }     from './domain-event-handler-param.type'
import { DOMAIN_EVENT_ARGS_METADATA }      from './domain-event.decorator'
import { createDomainEventParamDecorator } from './domain-event.decorator'

const addStateParamMetadata = (target, key) => {
  const args = Reflect.getMetadata(DOMAIN_EVENT_ARGS_METADATA, target.constructor, key) || {}

  createDomainEventParamDecorator(DomainEventHandlerParamType.STATE)(
    target,
    key,
    Object.keys(args).length
  )
}

export interface EventSourcingHandlerMetadata {
  event: IEvent
}

export const EVENT_SOURCING_HANDLER_METADATA = '__eventSourcingHandler__'

export const EventSourcingHandler = (event: IEvent): MethodDecorator =>
  applyDecorators(SetMetadata(EVENT_SOURCING_HANDLER_METADATA, { event }), addStateParamMetadata)
