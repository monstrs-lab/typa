import { Provider }                             from '@nestjs/common'

import { PriorityQueueCommandBus }              from '../bus'
import { SimpleCommandBus }                     from '../bus'
import { CommandGateway }                       from '../gateway'
import { CommandHandlingMetadataAccessor }      from '../metadata'
import { CommandHandlingMetadataExplorer }      from '../metadata'
import { CommandHandlingMetadataRegistry }      from '../metadata'
import { CommandHandlingModuleOptions }         from './command-handling-module-options.interface'
import { TYPA_COMMAND_HANDLING_MODULE_OPTIONS } from './command-handling.constants'

export const createCommandHandlingOptionsProvider = (
  options?: CommandHandlingModuleOptions
): Provider[] => [
  {
    provide: TYPA_COMMAND_HANDLING_MODULE_OPTIONS,
    useValue: options || {},
  },
]

export const createCommandHandlingProvider = (): Provider[] => [
  CommandHandlingMetadataAccessor,
  CommandHandlingMetadataExplorer,
  CommandHandlingMetadataRegistry,
  PriorityQueueCommandBus,
  SimpleCommandBus,
]

export const createCommandHandlingExportsProvider = (): Provider[] => [
  {
    provide: CommandGateway,
    useFactory: (comandBus) => new CommandGateway(comandBus),
    inject: [SimpleCommandBus],
  },
]
