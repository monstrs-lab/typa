import { DynamicModule, Module } from '@nestjs/common'

import { TypaLoggerModule }      from '@typa/logger'

@Module({})
export class TypaModule {
  static register(): DynamicModule {
    return {
      global: true,
      module: TypaModule,
      imports: [TypaLoggerModule.register()],
    }
  }
}
