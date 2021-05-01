import { Logger }                               from '@monstrs/logger'
import { Injectable }                           from '@nestjs/common'
import { Reflector }                            from '@nestjs/core'

import { TARGET_AGGREGATE_IDENTIFIER_METADATA } from '../decorators'
import { COMMAND_HANDLER_METADATA }             from '../decorators'
import { CommandHandlerMetadata }               from '../decorators'

@Injectable()
export class CommandHandlingMetadataAccessor {
  private readonly logger = new Logger(CommandHandlingMetadataAccessor.name)

  constructor(private readonly reflector: Reflector) {}

  getCommandHandlerMetadata(target: Function): CommandHandlerMetadata | undefined {
    return this.reflector.get(COMMAND_HANDLER_METADATA, target)
  }

  getTargetAggregateIdentifier(target: Function): string | undefined {
    const index = Reflect.getMetadata(TARGET_AGGREGATE_IDENTIFIER_METADATA, target.constructor)

    if (!(index >= 0)) {
      return undefined
    }
    const targetAggregateIdentifierValue = 'targetAggregateIdentifierValue'

    const args = Array.from(Array(target.constructor.length)).fill(
      targetAggregateIdentifierValue,
      index,
      index + 1
    )

    try {
      // @ts-ignore
      const cmd = new target(...args) // eslint-disable-line

      const [targetAggregateIdentifier] =
        Object.entries(cmd).find((entry) => entry[1] === targetAggregateIdentifierValue) || []

      return targetAggregateIdentifier
    } catch (error) {
      this.logger.error('Extract target aggregate identifier failed', error)

      return undefined
    }
  }
}
