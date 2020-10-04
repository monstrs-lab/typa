import { DynamicModule, Module, Provider }      from '@nestjs/common'
import { DiscoveryModule }                      from '@nestjs/core'

import { CommandHandlingModuleAsyncOptions }    from './command-handling-module-options.interface'
import { CommandHandlingModuleOptions }         from './command-handling-module-options.interface'
import { CommandHandlingOptionsFactory }        from './command-handling-module-options.interface'
import { TYPA_COMMAND_HANDLING_MODULE_OPTIONS } from './command-handling.constants'
import { createCommandHandlingExportsProvider } from './command-handling.providers'
import { createCommandHandlingProvider }        from './command-handling.providers'
import { createCommandHandlingOptionsProvider } from './command-handling.providers'

@Module({
  imports: [DiscoveryModule],
})
export class TypaCommandHandlingModule {
  static register(options?: CommandHandlingModuleOptions): DynamicModule {
    const optionsProviders = createCommandHandlingOptionsProvider(options)
    const exportsProviders = createCommandHandlingExportsProvider()
    const providers = createCommandHandlingProvider()

    return {
      global: true,
      module: TypaCommandHandlingModule,
      providers: [...optionsProviders, ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  static registerAsync(options: CommandHandlingModuleAsyncOptions): DynamicModule {
    const exportsProviders = createCommandHandlingExportsProvider()
    const providers = createCommandHandlingProvider()

    return {
      global: true,
      module: TypaCommandHandlingModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  private static createAsyncProviders(options: CommandHandlingModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass!,
        useClass: options.useClass!,
      },
    ]
  }

  private static createAsyncOptionsProvider(options: CommandHandlingModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: TYPA_COMMAND_HANDLING_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: TYPA_COMMAND_HANDLING_MODULE_OPTIONS,
      useFactory: (optionsFactory: CommandHandlingOptionsFactory) =>
        optionsFactory.createCommandHandlingOptions(),
      inject: [options.useExisting! || options.useClass!],
    }
  }
}
