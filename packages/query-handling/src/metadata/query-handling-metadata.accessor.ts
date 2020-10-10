import { Injectable }             from '@nestjs/common'
import { Reflector }              from '@nestjs/core'

import { QUERY_HANDLER_METADATA } from '../decorators'
import { QueryHandlerMetadata }   from '../decorators'

@Injectable()
export class QueryHandlingMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getQueryHandlerMetadata(target: Function): QueryHandlerMetadata | undefined {
    return this.reflector.get(QUERY_HANDLER_METADATA, target)
  }
}
