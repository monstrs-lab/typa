import { Logger }                from '@monstrs/logger'
import { Injectable }            from '@nestjs/common'

import { CommandHandlingMember } from './command-handling.member'

@Injectable()
export class CommandHandlingMetadataRegistry {
  private logger = new Logger(CommandHandlingMetadataRegistry.name)

  private commandHandlers: Map<string, CommandHandlingMember> = new Map()

  addCommandHandler(commandName, handler: CommandHandlingMember) {
    if (this.commandHandlers.has(commandName)) {
      this.logger.warn(`Command handler for command ${commandName} already exists`)
    }

    this.commandHandlers.set(commandName, handler)
  }

  getCommandHandler(commandName) {
    return this.commandHandlers.get(commandName)
  }
}
