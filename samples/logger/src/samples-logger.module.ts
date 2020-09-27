import { Module }           from '@nestjs/common'

import { TypaModule }       from '@typa/common'

import { LoggerController } from './logger.controller'

@Module({
  imports: [TypaModule.register()],
  controllers: [LoggerController],
})
export class SamplesLoggerModule {}
