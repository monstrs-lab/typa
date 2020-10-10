import { SetMetadata, applyDecorators } from '@nestjs/common'

import { IQueryConstructor }            from '../interfaces'
import { QueryHandlerParamType }        from './query-handler-param.type'
import { assignMetadata }               from './param.utils'

export const QUERY_HANDLER_ARGS_METADATA = '__queryHandlerArguments__'
export const QUERY_HANDLER_METADATA = '__queryHandler__'

export const createQueryHandlerParamDecorator = (
  paramtype: QueryHandlerParamType
): ParameterDecorator => (target, key, index) => {
  const args = Reflect.getMetadata(QUERY_HANDLER_ARGS_METADATA, target.constructor, key) || {}

  Reflect.defineMetadata(
    QUERY_HANDLER_ARGS_METADATA,
    assignMetadata(args, paramtype, index),
    target.constructor,
    key
  )
}

export interface QueryHandlerMetadata {
  query: IQueryConstructor
}

export const QueryHandler = (query: IQueryConstructor): MethodDecorator =>
  applyDecorators(SetMetadata(QUERY_HANDLER_METADATA, { query }))
