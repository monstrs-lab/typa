import { IEventConstructor }    from '@typa/event-handling'

import { CommandRejectedEvent } from '../events'
import { CommandFailedEvent }   from '../events'

type Constructor = new (...args: any[]) => {}

const CommandDispatchError = (EventType: typeof CommandRejectedEvent | typeof CommandFailedEvent) =>
  function Composite<T extends Constructor>(Target: T): IEventConstructor {
    const type = EventType === CommandRejectedEvent ? 'Rejected' : 'Failed'

    const event = class extends EventType {}

    Object.defineProperty(event, 'name', {
      value: `${Target.name}${type}`,
      writable: true,
    })

    return event
  }

export const CommandRejected = CommandDispatchError(CommandRejectedEvent)
export const CommandFailed = CommandDispatchError(CommandFailedEvent)
