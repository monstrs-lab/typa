import { CommandHandlerParamType }            from './command-handler-param.type'
import { createCommandHandlerParamDecorator } from './command-handler.decorator'

export const ApplyEvent = createCommandHandlerParamDecorator(CommandHandlerParamType.APPLY_EVENT)
