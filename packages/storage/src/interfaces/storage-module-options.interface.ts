import { ModuleMetadata, Type } from '@nestjs/common/interfaces'

export interface InMemoryStoreOptions {
  type: 'inmemory'
  entityPrefix?: string
}

export interface PostgresStoreOptions {
  type: 'postgres'
  host: string
  database: string
  username: string
  password: string
  port?: number
  entityPrefix?: string
}

export type StorageModuleOptions = InMemoryStoreOptions | PostgresStoreOptions

export interface StorageOptionsFactory {
  createStorageOptions(): Promise<StorageModuleOptions> | StorageModuleOptions
}

export interface StorageModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<StorageOptionsFactory>
  useClass?: Type<StorageOptionsFactory>
  useFactory?: (...args: any[]) => Promise<StorageModuleOptions> | StorageModuleOptions
  inject?: any[]
}
