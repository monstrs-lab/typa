import { LoggerService } from '@nestjs/common'
import { log }           from '@monstrs/log'

export class NestLogger implements LoggerService {
  private logger = log.getLogger()

  public log(message: any, context?: string) {
    return this.logger.info({ ...this.prepareMessage(message), context })
  }

  public error(message: any, trace?: string, context?: string) {
    return this.logger.error({ ...this.prepareMessage(message), stack: trace, context })
  }

  public warn(message: any, context?: string) {
    return this.logger.warn({ ...this.prepareMessage(message), context })
  }

  public debug?(message: any, context?: string) {
    return this.logger.debug({ ...this.prepareMessage(message), context })
  }

  public verbose?(message: any, context?: string) {
    return this.logger.verbose({ ...this.prepareMessage(message), context })
  }

  private prepareMessage(message: any): object {
    if (!(message instanceof Object)) {
      return { message }
    }

    return message
  }
}
