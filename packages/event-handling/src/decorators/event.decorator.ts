import { EventHandlerParamType }            from './event-handler-param.type'
import { createEventHandlerParamDecorator } from './event-handler.decorator'

export const Event = createEventHandlerParamDecorator(EventHandlerParamType.EVENT)
