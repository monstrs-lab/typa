import { ModuleMetadata, Type } from '@nestjs/common/interfaces'

export interface EventHandlingModuleOptions {}

export interface EventHandlingOptionsFactory {
  createEventHandlingOptions(): Promise<EventHandlingModuleOptions> | EventHandlingModuleOptions
}

export interface EventHandlingModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<EventHandlingOptionsFactory>
  useClass?: Type<EventHandlingOptionsFactory>
  useFactory?: (...args: any[]) => Promise<EventHandlingModuleOptions> | EventHandlingModuleOptions
  inject?: any[]
}
