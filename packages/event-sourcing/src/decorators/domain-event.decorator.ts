import { DomainEventHandlerParamType } from './domain-event-handler-param.type'
import { assignMetadata }              from './param.utils'

export const DOMAIN_EVENT_ARGS_METADATA = '__domainEventArgumentsMetadata__'

export const createDomainEventParamDecorator = (
  paramtype: DomainEventHandlerParamType
): ParameterDecorator => (target, key, index) => {
  const args = Reflect.getMetadata(DOMAIN_EVENT_ARGS_METADATA, target.constructor, key) || {}

  Reflect.defineMetadata(
    DOMAIN_EVENT_ARGS_METADATA,
    assignMetadata<DomainEventHandlerParamType>(args, paramtype, index),
    target.constructor,
    key
  )
}

export const DomainEvent = createDomainEventParamDecorator(DomainEventHandlerParamType.DOMAIN_EVENT)
