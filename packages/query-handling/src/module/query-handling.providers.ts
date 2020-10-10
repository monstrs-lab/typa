import { Provider }                           from '@nestjs/common'

import { InMemoryQueryBus }                   from '../bus'
import { QueryGateway }                       from '../gateway'
import { QueryHandlingMetadataAccessor }      from '../metadata'
import { QueryHandlingMetadataExplorer }      from '../metadata'
import { QueryHandlingMetadataRegistry }      from '../metadata'
import { QueryHandlingModuleOptions }         from './query-handling-module-options.interface'
import { TYPA_QUERY_HANDLING_MODULE_OPTIONS } from './query-handling.constants'

export const createQueryHandlingOptionsProvider = (
  options?: QueryHandlingModuleOptions
): Provider[] => {
  return [
    {
      provide: TYPA_QUERY_HANDLING_MODULE_OPTIONS,
      useValue: options || {},
    },
  ]
}

export const createQueryHandlingProvider = (): Provider[] => {
  return [
    QueryHandlingMetadataAccessor,
    QueryHandlingMetadataExplorer,
    QueryHandlingMetadataRegistry,
    InMemoryQueryBus,
  ]
}

export const createQueryHandlingExportsProvider = (): Provider[] => {
  return [
    {
      provide: QueryGateway,
      useFactory: (comandBus) => new QueryGateway(comandBus),
      inject: [InMemoryQueryBus],
    },
  ]
}
