import { Injectable }          from '@nestjs/common'

import { EventHandlingMember } from './event-handling.member'

@Injectable()
export class EventHandlingMetadataRegistry {
  private eventHandlers: Set<EventHandlingMember> = new Set()

  addEventHandler(handler: EventHandlingMember) {
    this.eventHandlers.add(handler)
  }

  getEventHandlers() {
    return this.eventHandlers
  }
}
