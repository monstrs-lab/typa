import { Injectable }             from '@nestjs/common'
import { Reflector }              from '@nestjs/core'

import { EVENT_HANDLER_METADATA } from '../decorators'
import { EventHandlerMetadata }   from '../decorators'

@Injectable()
export class EventHandlingMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getEventHandlerMetadata(target: Function): EventHandlerMetadata | undefined {
    return this.reflector.get(EVENT_HANDLER_METADATA, target)
  }
}
