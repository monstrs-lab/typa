import { Injectable }                         from '@nestjs/common'

import { QueryHandlerAlreadyExistsException } from '../exceptions'
import { QueryHandlingMember }                from './query-handling.member'

@Injectable()
export class QueryHandlingMetadataRegistry {
  private queryHandlers: Map<string, QueryHandlingMember> = new Map()

  addQueryHandler(queryName: string, handler: QueryHandlingMember) {
    if (this.queryHandlers.has(queryName)) {
      throw new QueryHandlerAlreadyExistsException(queryName)
    }

    this.queryHandlers.set(queryName, handler)
  }

  getQueryHandler(queryName: string) {
    return this.queryHandlers.get(queryName)
  }
}
