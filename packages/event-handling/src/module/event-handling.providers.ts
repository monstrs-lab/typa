import { Provider }                           from '@nestjs/common'

import { EventHandlingMetadataAccessor }      from '../metadata'
import { EventHandlingMetadataExplorer }      from '../metadata'
import { EventHandlingMetadataRegistry }      from '../metadata'
import { DomainEventPublisher }               from '../publisher'
import { SimpleDomainEventPublisher }         from '../publisher'
import { EventHandlingModuleOptions }         from './event-handling-module-options.interface'
import { TYPA_EVENT_HANDLING_MODULE_OPTIONS } from './event-handling.constants'

export const createEventHandlingOptionsProvider = (
  options?: EventHandlingModuleOptions
): Provider[] => [
  {
    provide: TYPA_EVENT_HANDLING_MODULE_OPTIONS,
    useValue: options || {},
  },
]

export const createEventHandlingProvider = (): Provider[] => [
  EventHandlingMetadataAccessor,
  EventHandlingMetadataExplorer,
  EventHandlingMetadataRegistry,
]

export const createEventHandlingExportsProvider = (): Provider[] => [
  SimpleDomainEventPublisher,
  DomainEventPublisher,
]
