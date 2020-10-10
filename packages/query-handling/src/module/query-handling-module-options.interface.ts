import { ModuleMetadata, Type } from '@nestjs/common/interfaces'

export interface QueryHandlingModuleOptions {}

export interface QueryHandlingOptionsFactory {
  createQueryHandlingOptions(): Promise<QueryHandlingModuleOptions> | QueryHandlingModuleOptions
}

export interface QueryHandlingModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<QueryHandlingOptionsFactory>
  useClass?: Type<QueryHandlingOptionsFactory>
  useFactory?: (...args: any[]) => Promise<QueryHandlingModuleOptions> | QueryHandlingModuleOptions
  inject?: any[]
}
