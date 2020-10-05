import { DynamicModule, Module, Provider }    from '@nestjs/common'
import { DiscoveryModule }                    from '@nestjs/core'

import { EventHandlingModuleAsyncOptions }    from './event-handling-module-options.interface'
import { EventHandlingModuleOptions }         from './event-handling-module-options.interface'
import { EventHandlingOptionsFactory }        from './event-handling-module-options.interface'
import { TYPA_EVENT_HANDLING_MODULE_OPTIONS } from './event-handling.constants'
import { createEventHandlingExportsProvider } from './event-handling.providers'
import { createEventHandlingProvider }        from './event-handling.providers'
import { createEventHandlingOptionsProvider } from './event-handling.providers'

@Module({
  imports: [DiscoveryModule],
})
export class TypaEventHandlingModule {
  static register(options?: EventHandlingModuleOptions): DynamicModule {
    const optionsProviders = createEventHandlingOptionsProvider(options)
    const exportsProviders = createEventHandlingExportsProvider()
    const providers = createEventHandlingProvider()

    return {
      global: true,
      module: TypaEventHandlingModule,
      providers: [...optionsProviders, ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  static registerAsync(options: EventHandlingModuleAsyncOptions): DynamicModule {
    const exportsProviders = createEventHandlingExportsProvider()
    const providers = createEventHandlingProvider()

    return {
      global: true,
      module: TypaEventHandlingModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  private static createAsyncProviders(options: EventHandlingModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: EventHandlingModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: TYPA_EVENT_HANDLING_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: TYPA_EVENT_HANDLING_MODULE_OPTIONS,
      useFactory: (optionsFactory: EventHandlingOptionsFactory) =>
        optionsFactory.createEventHandlingOptions(),
      inject: [options.useExisting! || options.useClass!],
    }
  }
}
