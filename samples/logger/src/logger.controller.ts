import { Controller, Get } from '@nestjs/common'

import { Logger }          from '@typa/common'

@Controller('logger')
export class LoggerController {
  private logger = new Logger(LoggerController.name)

  @Get('info')
  info() {
    this.logger.info('Info message')
  }

  @Get('error')
  error() {
    this.logger.error(new Error('Error message'))
  }
}
