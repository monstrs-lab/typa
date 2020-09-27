import { DynamicModule, Module } from '@nestjs/common'

import { createLoggerProvider }  from './logger.providers'

@Module({})
export class TypaLoggerModule {
  static register(): DynamicModule {
    const providers = createLoggerProvider()

    return {
      global: true,
      module: TypaLoggerModule,
      exports: providers,
      providers,
    }
  }
}
