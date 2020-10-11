import { SetMetadata, applyDecorators } from '@nestjs/common'

import { IEventConstructor }            from '../interfaces'
import { EventHandlerParamType }        from './event-handler-param.type'
import { assignMetadata }               from './param.utils'

export const EVENT_HANDLER_ARGS_METADATA = '__eventHandlerArguments__'
export const EVENT_HANDLER_METADATA = '__eventHandler__'

export const createEventHandlerParamDecorator = (
  paramtype: EventHandlerParamType
): ParameterDecorator => (target, key, index) => {
  const args = Reflect.getMetadata(EVENT_HANDLER_ARGS_METADATA, target.constructor, key) || {}

  Reflect.defineMetadata(
    EVENT_HANDLER_ARGS_METADATA,
    assignMetadata(args, paramtype, index),
    target.constructor,
    key
  )
}

export interface EventHandlerMetadata {
  event: IEventConstructor
}

export const EventHandler = (event: IEventConstructor): MethodDecorator =>
  applyDecorators(SetMetadata(EVENT_HANDLER_METADATA, { event }))
