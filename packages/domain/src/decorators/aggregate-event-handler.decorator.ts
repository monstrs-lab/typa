import { SetMetadata, applyDecorators }    from '@nestjs/common'

import { IEventConstructor }               from '@typa/event-handling'

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

export interface AggregateEventHandlerMetadata {
  event: IEventConstructor
}

export const AGGREGATE_EVENT_HANDLER_METADATA = '__aggregateEventHandler__'

export const AggregateEventHandler = (event: IEventConstructor): MethodDecorator =>
  applyDecorators(SetMetadata(AGGREGATE_EVENT_HANDLER_METADATA, { event }), addStateParamMetadata)
