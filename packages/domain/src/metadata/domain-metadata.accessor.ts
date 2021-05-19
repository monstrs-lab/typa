import { Injectable }                       from '@nestjs/common'
import { Reflector }                        from '@nestjs/core'

import { AGGREGATE_EVENT_HANDLER_METADATA } from '../decorators'
import { AGGREGATE_METADATA }               from '../decorators'
import { AggregateEventHandlerMetadata }    from '../decorators'
import { AggregateMetadata }                from '../decorators'

@Injectable()
export class DomainMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getAggregateEventHandleMetadata(target: Function): AggregateEventHandlerMetadata | undefined {
    return this.reflector.get(AGGREGATE_EVENT_HANDLER_METADATA, target)
  }

  getAggregateMetadata(target): AggregateMetadata | undefined {
    if (target.constructor) {
      const metadata = this.reflector.get(AGGREGATE_METADATA, target.constructor)

      if (!metadata) {
        return metadata
      }

      return {
        ...metadata,
        // eslint-disable-next-line prefer-object-spread
        initialState: Object.assign({}, target),
      }
    }

    return undefined
  }
}
