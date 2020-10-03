import { Injectable }               from '@nestjs/common'
import { Reflector }                from '@nestjs/core'

import { COMMAND_HANDLER_METADATA } from '../decorators'
import { CommandHandlerMetadata }   from '../decorators'

@Injectable()
export class CommandHandlingMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getCommandHandlerMetadata(target: Function): CommandHandlerMetadata | undefined {
    return this.reflector.get(COMMAND_HANDLER_METADATA, target)
  }
}
