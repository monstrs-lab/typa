import { Provider }                      from '@nestjs/common'

import { ConsumerProgressStore }         from '../consumer-progress-store'
import { DomainEventStore }              from '../domain-event-store'
import { LockStore }                     from '../lock-store'
import { CommandPriorityQueueStore }     from '../priority-queue-store'
import { DomainEventPriorityQueueStore } from '../priority-queue-store'
import { StorageModuleOptions }          from './storage-module-options.interface'
import { TYPA_STORAGE_MODULE_OPTIONS }   from './storage.constants'
import { TypeOrmConfig }                 from './typeorm.config'

export const createStorageOptionsProvider = (options: StorageModuleOptions): Provider[] => {
  return [
    {
      provide: TYPA_STORAGE_MODULE_OPTIONS,
      useValue: options || {
        type: 'inmemory',
      },
    },
  ]
}

export const createStorageProvider = (): Provider[] => {
  return []
}

export const createStorageExportsProvider = (): Provider[] => {
  return [
    TypeOrmConfig,
    LockStore,
    ConsumerProgressStore,
    DomainEventStore,
    DomainEventPriorityQueueStore,
    CommandPriorityQueueStore,
  ]
}
