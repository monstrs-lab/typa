import { Inject, Injectable }    from '@nestjs/common'

import { StorageOptionsFactory } from '@typa/storage'
import { StorageModuleOptions }  from '@typa/storage'

import { TYPA_MODULE_OPTIONS }   from './typa.constants'
import { TypaModuleOptions }     from './type-module-options.interface'

@Injectable()
export class ChildrenModulesConfig implements StorageOptionsFactory {
  constructor(@Inject(TYPA_MODULE_OPTIONS) private readonly options: TypaModuleOptions) {}

  createStorageOptions(): StorageModuleOptions {
    return this.options.storage
  }
}
