import { ModuleMetadata, Type } from '@nestjs/common/interfaces'

export interface EventSourcingModuleOptions {}

export interface EventSourcingOptionsFactory {
  createEventSourcingOptions(): Promise<EventSourcingModuleOptions> | EventSourcingModuleOptions
}

export interface EventSourcingModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<EventSourcingOptionsFactory>
  useClass?: Type<EventSourcingOptionsFactory>
  useFactory?: (...args: any[]) => Promise<EventSourcingModuleOptions> | EventSourcingModuleOptions
  inject?: any[]
}
