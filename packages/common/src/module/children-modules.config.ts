import { Inject, Injectable }            from '@nestjs/common'

import { CommandHandlingOptionsFactory } from '@typa/command-handling'
import { CommandHandlingModuleOptions }  from '@typa/command-handling'
import { EventHandlingOptionsFactory }   from '@typa/event-handling'
import { EventHandlingModuleOptions }    from '@typa/event-handling'
import { EventSourcingOptionsFactory }   from '@typa/event-sourcing'
import { EventSourcingModuleOptions }    from '@typa/event-sourcing'
import { QueryHandlingOptionsFactory }   from '@typa/query-handling'
import { QueryHandlingModuleOptions }    from '@typa/query-handling'
import { StorageOptionsFactory }         from '@typa/storage'
import { StorageModuleOptions }          from '@typa/storage'
import { StorageType }                   from '@typa/storage'

import { TYPA_MODULE_OPTIONS }           from './typa.constants'
import { TypaModuleOptions }             from './type-module-options.interface'

@Injectable()
export class ChildrenModulesConfig
  implements
    StorageOptionsFactory,
    EventSourcingOptionsFactory,
    CommandHandlingOptionsFactory,
    EventHandlingOptionsFactory,
    QueryHandlingOptionsFactory {
  constructor(@Inject(TYPA_MODULE_OPTIONS) private readonly options: TypaModuleOptions) {}

  createStorageOptions(): StorageModuleOptions {
    return (
      this.options.storage || {
        type: StorageType.inmemory,
      }
    )
  }

  createEventSourcingOptions(): EventSourcingModuleOptions {
    return {}
  }

  createCommandHandlingOptions(): CommandHandlingModuleOptions {
    return {}
  }

  createEventHandlingOptions(): EventHandlingModuleOptions {
    return {}
  }

  createQueryHandlingOptions(): QueryHandlingModuleOptions {
    return {}
  }
}
