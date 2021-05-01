import { Provider }                             from '@nestjs/common'

import { PriorityQueueCommandBus }              from '../bus'
import { CommandGateway }                       from '../gateway'
import { CommandHandlingMetadataAccessor }      from '../metadata'
import { CommandHandlingMetadataExplorer }      from '../metadata'
import { CommandHandlingMetadataRegistry }      from '../metadata'
import { CommandHandlingWorker }                from '../processor'
import { CommandProcessor }                     from '../processor'
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
  CommandHandlingWorker,
]

export const createCommandHandlingExportsProvider = (): Provider[] => [
  CommandProcessor,
  {
    provide: CommandGateway,
    useFactory: (comandBus) => new CommandGateway(comandBus),
    inject: [PriorityQueueCommandBus],
  },
]
