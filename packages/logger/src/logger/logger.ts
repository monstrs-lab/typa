import { Logger as LoggerInstance, log } from '@monstrs/log'

export class Logger {
  private logger: LoggerInstance

  constructor(context?: string) {
    this.logger = log.getLogger(context)
  }

  log(entry) {
    return this.logger.log(entry)
  }

  emerg(message, ...rest) {
    return this.logger.emerg(message, ...rest)
  }

  alert(message, ...rest) {
    return this.logger.alert(message, ...rest)
  }

  crit(message, ...rest) {
    return this.logger.crit(message, ...rest)
  }

  error(message, ...rest) {
    return this.logger.error(message, ...rest)
  }

  warning(message, ...rest) {
    return this.logger.warning(message, ...rest)
  }

  notice(message, ...rest) {
    return this.logger.notice(message, ...rest)
  }

  info(message, ...rest) {
    return this.logger.info(message, ...rest)
  }

  debug(message, ...rest) {
    return this.logger.debug(message, ...rest)
  }
}
