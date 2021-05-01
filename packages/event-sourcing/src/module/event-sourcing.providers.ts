import { Provider }                           from '@nestjs/common'

import { Repository }                         from '../aggregate'
import { EventSourcingMetadataAccessor }      from '../metadata'
import { EventSourcingMetadataExplorer }      from '../metadata'
import { EventSourcingMetadataRegistry }      from '../metadata'
import { EventSourcingModuleOptions }         from './event-sourcing-module-options.interface'
import { TYPA_EVENT_SOURCING_MODULE_OPTIONS } from './event-sourcing.constants'

export const createEventSourcingOptionsProvider = (
  options?: EventSourcingModuleOptions
): Provider[] => [
  {
    provide: TYPA_EVENT_SOURCING_MODULE_OPTIONS,
    useValue: options || {},
  },
]

export const createEventSourcingProvider = (): Provider[] => [
  EventSourcingMetadataAccessor,
  EventSourcingMetadataExplorer,
  EventSourcingMetadataRegistry,
]

export const createEventSourcingExportsProvider = (): Provider[] => [Repository]
