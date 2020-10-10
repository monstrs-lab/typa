import { QueryHandlerParamType }            from './query-handler-param.type'
import { createQueryHandlerParamDecorator } from './query-handler.decorator'

export const Query = createQueryHandlerParamDecorator(QueryHandlerParamType.QUERY)
