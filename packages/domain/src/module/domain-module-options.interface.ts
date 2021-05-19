import { ModuleMetadata, Type } from '@nestjs/common/interfaces'

export interface DomainModuleOptions {}

export interface DomainOptionsFactory {
  createDomainOptions(): Promise<DomainModuleOptions> | DomainModuleOptions
}

export interface DomainModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<DomainOptionsFactory>
  useClass?: Type<DomainOptionsFactory>
  useFactory?: (...args: any[]) => Promise<DomainModuleOptions> | DomainModuleOptions
  inject?: any[]
}
