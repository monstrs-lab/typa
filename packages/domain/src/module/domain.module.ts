import { DynamicModule, Module, Provider } from '@nestjs/common'
import { DiscoveryModule }                 from '@nestjs/core'

import { DomainModuleAsyncOptions }        from './domain-module-options.interface'
import { DomainModuleOptions }             from './domain-module-options.interface'
import { DomainOptionsFactory }            from './domain-module-options.interface'
import { TYPA_DOMAIN_MODULE_OPTIONS }      from './domain.constants'
import { createDomainExportsProvider }     from './domain.providers'
import { createDomainProvider }            from './domain.providers'
import { createDomainOptionsProvider }     from './domain.providers'

@Module({
  imports: [DiscoveryModule],
})
export class TypaDomainModule {
  static register(options?: DomainModuleOptions): DynamicModule {
    const optionsProviders = createDomainOptionsProvider(options)
    const exportsProviders = createDomainExportsProvider()
    const providers = createDomainProvider()

    return {
      global: true,
      module: TypaDomainModule,
      providers: [...optionsProviders, ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  static registerAsync(options: DomainModuleAsyncOptions): DynamicModule {
    const exportsProviders = createDomainExportsProvider()
    const providers = createDomainProvider()

    return {
      global: true,
      module: TypaDomainModule,
      imports: options.imports || [],
      providers: [...this.createAsyncProviders(options), ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  private static createAsyncProviders(options: DomainModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: DomainModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: TYPA_DOMAIN_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: TYPA_DOMAIN_MODULE_OPTIONS,
      useFactory: (optionsFactory: DomainOptionsFactory) => optionsFactory.createDomainOptions(),
      inject: [options.useExisting! || options.useClass!],
    }
  }
}
