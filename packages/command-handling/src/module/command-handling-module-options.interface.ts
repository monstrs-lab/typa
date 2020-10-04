import { ModuleMetadata, Type } from '@nestjs/common/interfaces'

export interface CommandHandlingModuleOptions {}

export interface CommandHandlingOptionsFactory {
  createCommandHandlingOptions():
    | Promise<CommandHandlingModuleOptions>
    | CommandHandlingModuleOptions
}

export interface CommandHandlingModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<CommandHandlingOptionsFactory>
  useClass?: Type<CommandHandlingOptionsFactory>
  useFactory?: (
    ...args: any[]
  ) => Promise<CommandHandlingModuleOptions> | CommandHandlingModuleOptions
  inject?: any[]
}
