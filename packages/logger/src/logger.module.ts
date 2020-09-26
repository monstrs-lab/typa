import { DynamicModule, Module } from '@nestjs/common'

import { createLoggerProvider }  from './logger.providers'

@Module({})
export class LoggerModule {
  static register(): DynamicModule {
    const providers = createLoggerProvider()

    return {
      global: true,
      module: LoggerModule,
      exports: providers,
      providers,
    }
  }
}
