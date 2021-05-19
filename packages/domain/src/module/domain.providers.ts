import { Provider }                   from '@nestjs/common'

import { Repository }                 from '../aggregate'
import { DomainMetadataAccessor }     from '../metadata'
import { DomainMetadataExplorer }     from '../metadata'
import { DomainMetadataRegistry }     from '../metadata'
import { DomainModuleOptions }        from './domain-module-options.interface'
import { TYPA_DOMAIN_MODULE_OPTIONS } from './domain.constants'

export const createDomainOptionsProvider = (options?: DomainModuleOptions): Provider[] => [
  {
    provide: TYPA_DOMAIN_MODULE_OPTIONS,
    useValue: options || {},
  },
]

export const createDomainProvider = (): Provider[] => [
  DomainMetadataAccessor,
  DomainMetadataExplorer,
  DomainMetadataRegistry,
]

export const createDomainExportsProvider = (): Provider[] => [Repository]
