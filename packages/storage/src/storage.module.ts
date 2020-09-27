import { DynamicModule, Module, Provider } from '@nestjs/common'
import { TypeOrmModule }                   from '@nestjs/typeorm'

import { StorageModuleAsyncOptions }       from './interfaces'
import { StorageModuleOptions }            from './interfaces'
import { StorageOptionsFactory }           from './interfaces'
import { TYPA_STORAGE_MODULE_OPTIONS }     from './storage.constants'
import { TypeOrmConfig }                   from './typeorm.config'
import { createStorageExportsProvider }    from './storage.providers'
import { createStorageProvider }           from './storage.providers'
import { createStorageOptionsProvider }    from './storage.providers'

@Module({})
export class TypaStorageModule {
  static register(options?: StorageModuleOptions): DynamicModule {
    const optionsProviders = createStorageOptionsProvider(options)
    const exportsProviders = createStorageExportsProvider()
    const providers = createStorageProvider()

    return {
      global: true,
      module: TypaStorageModule,
      providers: [...optionsProviders, ...providers, ...exportsProviders],
      exports: exportsProviders,
      imports: [
        TypeOrmModule.forRootAsync({
          useExisting: TypeOrmConfig,
        }),
      ],
    }
  }

  static registerAsync(options: StorageModuleAsyncOptions): DynamicModule {
    const exportsProviders = createStorageExportsProvider()
    const providers = createStorageProvider()

    return {
      global: true,
      module: TypaStorageModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useExisting: TypeOrmConfig,
        }),
        ...(options.imports || []),
      ],
      providers: [...this.createAsyncProviders(options), ...providers, ...exportsProviders],
      exports: exportsProviders,
    }
  }

  private static createAsyncProviders(options: StorageModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ]
  }

  private static createAsyncOptionsProvider(options: StorageModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: TYPA_STORAGE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: TYPA_STORAGE_MODULE_OPTIONS,
      useFactory: (optionsFactory: StorageOptionsFactory) => optionsFactory.createStorageOptions(),
      inject: [options.useExisting || options.useClass],
    }
  }
}
