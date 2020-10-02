import { SetMetadata, applyDecorators } from '@nestjs/common'

import { ICommand }                     from '../interfaces'
import { CommandHandlerParamType }      from './command-handler-param.type'
import { assignMetadata }               from './param.utils'

export const COMMAND_HANDLER_ARGS_METADATA = '__commandHandlerArguments__'
export const COMMAND_HANDLER_METADATA = '__commandHandler__'

export const createCommandHandlerParamDecorator = (
  paramtype: CommandHandlerParamType
): ParameterDecorator => (target, key, index) => {
  const args = Reflect.getMetadata(COMMAND_HANDLER_ARGS_METADATA, target.constructor, key) || {}

  Reflect.defineMetadata(
    COMMAND_HANDLER_ARGS_METADATA,
    assignMetadata(args, paramtype, index),
    target.constructor,
    key
  )
}

const addStateParamMetadata = (target, key) => {
  const args = Reflect.getMetadata(COMMAND_HANDLER_ARGS_METADATA, target.constructor, key) || {}

  createCommandHandlerParamDecorator(CommandHandlerParamType.STATE)(
    target,
    key,
    Object.keys(args).length
  )
}

export const CommandHandler = (command: ICommand): MethodDecorator =>
  applyDecorators(SetMetadata(COMMAND_HANDLER_METADATA, { command }), addStateParamMetadata)
