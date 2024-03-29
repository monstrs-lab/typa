import { DynamicModule, Module }     from '@nestjs/common'
import { Provider }                  from '@nestjs/common'

import { TypaCommandHandlingModule } from '@typa/command-handling'
import { TypaEventHandlingModule }   from '@typa/event-handling'
import { TypaDomainModule }          from '@typa/domain'
import { TypaQueryHandlingModule }   from '@typa/query-handling'
import { TypaStorageModule }         from '@typa/storage'

import { ChildrenModulesConfig }     from './children-modules.config'
import { TYPA_MODULE_OPTIONS }       from './typa.constants'
import { TypaModuleOptions }         from './type-module-options.interface'
import { TypaModuleAsyncOptions }    from './type-module-options.interface'
import { TypaOptionsFactory }        from './type-module-options.interface'

@Module({})
export class TypaModule {
  static register(options: TypaModuleOptions = {}): DynamicModule {
    return {
      global: true,
      module: TypaModule,
      providers: [
        {
          provide: TYPA_MODULE_OPTIONS,
          useValue: options,
        },
        ChildrenModulesConfig,
      ],
      exports: [ChildrenModulesConfig],
      imports: [
        TypaStorageModule.register(options.storage),
        TypaDomainModule.register(),
        TypaCommandHandlingModule.register(),
        TypaEventHandlingModule.register(),
        TypaQueryHandlingModule.register(),
      ],
    }
  }

  static registerAsync(options: TypaModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: TypaStorageModule,
      imports: [
        ...(options.imports || []),
        TypaStorageModule.registerAsync({
          useExisting: ChildrenModulesConfig,
        }),
        TypaDomainModule.registerAsync({
          useExisting: ChildrenModulesConfig,
        }),
        TypaCommandHandlingModule.registerAsync({
          useExisting: ChildrenModulesConfig,
        }),
        TypaEventHandlingModule.registerAsync({
          useExisting: ChildrenModulesConfig,
        }),
        TypaQueryHandlingModule.registerAsync({
          useExisting: ChildrenModulesConfig,
        }),
      ],
      providers: [...this.createAsyncProviders(options), ChildrenModulesConfig],
      exports: [ChildrenModulesConfig],
    }
  }

  private static createAsyncProviders(options: TypaModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: TypaModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: TYPA_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: TYPA_MODULE_OPTIONS,
      useFactory: (optionsFactory: TypaOptionsFactory) => optionsFactory.createTypaOptions(),
      inject: [options.useExisting! || options.useClass!],
    }
  }
}
