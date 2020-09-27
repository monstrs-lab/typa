import { ModuleMetadata, Type } from '@nestjs/common/interfaces'

import { StorageModuleOptions } from '@typa/storage'

export interface TypaModuleOptions {
  storage?: StorageModuleOptions
}

export interface TypaOptionsFactory {
  createTypaOptions(): Promise<TypaModuleOptions> | TypaModuleOptions
}

export interface TypaModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<TypaOptionsFactory>
  useClass?: Type<TypaOptionsFactory>
  useFactory?: (...args: any[]) => Promise<TypaModuleOptions> | TypaModuleOptions
  inject?: any[]
}
