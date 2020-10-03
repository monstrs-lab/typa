import { Injectable } from '@nestjs/common'

import { Logger }     from '@typa/logger'

type CommandMessageHandlerMember = any

@Injectable()
export class CommandHandlingMetadataRegistry {
  private logger = new Logger(CommandHandlingMetadataRegistry.name)

  private commandHandlers: Map<string, Map<string, CommandMessageHandlerMember>> = new Map()

  addCommandHandler(instanceName, command, handler: CommandMessageHandlerMember) {
    if (!this.commandHandlers.has(instanceName)) {
      this.commandHandlers.set(instanceName, new Map())
    }

    if (this.commandHandlers.get(instanceName)!.has(command)) {
      this.logger.warning(`Command handler for command ${command} already exists`)
    }

    this.commandHandlers.get(instanceName)!.set(command, handler)
  }

  getCommandHandler(instanceName, command) {
    return this.commandHandlers.get(instanceName)?.get(command)
  }
}
