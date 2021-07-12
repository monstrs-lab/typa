import { CommandHandlerParamType }            from './command-handler-param.type'
import { createCommandHandlerParamDecorator } from './command-handler.decorator'

export const AggregateRepository = createCommandHandlerParamDecorator(
  CommandHandlerParamType.AGGREGATE_REPOSITORY
)
