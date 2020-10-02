import { DynamicModule, Module, Provider }    from '@nestjs/common'
import { DiscoveryModule }                    from '@nestjs/core'

import { EventSourcingModuleAsyncOptions }    from './event-sourcing-module-options.interface'
import { EventSourcingModuleOptions }         from './event-sourcing-module-options.interface'
import { EventSourcingOptionsFactory }        from './event-sourcing-module-options.interface'
import { TYPA_EVENT_SOURCING_MODULE_OPTIONS } from './event-sourcing.constants'
import { createEventSourcingExportsProvider } from './event-sourcing.providers'
import { createEventSourcingProvider }        from './event-sourcing.providers'
import { createEventSourcingOptionsProvider } from './event-sourcing.providers'

@Module({
  imports: [DiscoveryModule],
})
export class TypaEventSourcingModule {
  static register(options?: EventSourcingModuleOptions): DynamicModule {
    const optionsProviders = createEventSourcingOptionsProvider(options)
    const exportsProviders = createEventSourcingExportsProvider()
    const providers = createEventSourcingProvider()

    return {
      global: true,
      module: TypaEventSourcingModule,
      providers: [...optionsProviders, ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  static registerAsync(options: EventSourcingModuleAsyncOptions): DynamicModule {
    const exportsProviders = createEventSourcingExportsProvider()
    const providers = createEventSourcingProvider()

    return {
      global: true,
      module: TypaEventSourcingModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  private static createAsyncProviders(options: EventSourcingModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: EventSourcingModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: TYPA_EVENT_SOURCING_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: TYPA_EVENT_SOURCING_MODULE_OPTIONS,
      useFactory: (optionsFactory: EventSourcingOptionsFactory) =>
        optionsFactory.createEventSourcingOptions(),
      inject: [options.useExisting! || options.useClass!],
    }
  }
}
