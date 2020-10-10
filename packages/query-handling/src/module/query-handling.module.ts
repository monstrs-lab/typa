import { DynamicModule, Module, Provider }    from '@nestjs/common'
import { DiscoveryModule }                    from '@nestjs/core'

import { QueryHandlingModuleAsyncOptions }    from './query-handling-module-options.interface'
import { QueryHandlingModuleOptions }         from './query-handling-module-options.interface'
import { QueryHandlingOptionsFactory }        from './query-handling-module-options.interface'
import { TYPA_QUERY_HANDLING_MODULE_OPTIONS } from './query-handling.constants'
import { createQueryHandlingExportsProvider } from './query-handling.providers'
import { createQueryHandlingProvider }        from './query-handling.providers'
import { createQueryHandlingOptionsProvider } from './query-handling.providers'

@Module({
  imports: [DiscoveryModule],
})
export class TypaQueryHandlingModule {
  static register(options?: QueryHandlingModuleOptions): DynamicModule {
    const optionsProviders = createQueryHandlingOptionsProvider(options)
    const exportsProviders = createQueryHandlingExportsProvider()
    const providers = createQueryHandlingProvider()

    return {
      global: true,
      module: TypaQueryHandlingModule,
      providers: [...optionsProviders, ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  static registerAsync(options: QueryHandlingModuleAsyncOptions): DynamicModule {
    const exportsProviders = createQueryHandlingExportsProvider()
    const providers = createQueryHandlingProvider()

    return {
      global: true,
      module: TypaQueryHandlingModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  private static createAsyncProviders(options: QueryHandlingModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: QueryHandlingModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: TYPA_QUERY_HANDLING_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: TYPA_QUERY_HANDLING_MODULE_OPTIONS,
      useFactory: (optionsFactory: QueryHandlingOptionsFactory) =>
        optionsFactory.createQueryHandlingOptions(),
      inject: [options.useExisting! || options.useClass!],
    }
  }
}
