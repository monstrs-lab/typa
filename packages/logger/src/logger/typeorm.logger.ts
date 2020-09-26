import { Logger } from 'typeorm'
import { log }    from '@monstrs/log'

export class TypeOrmLogger implements Logger {
  private logger = log.getLogger('typeorm')

  logQuery(query: string, parameters?: any[]) {
    this.logger.debug('query', {
      context: 'query',
      sql: {
        query,
        parameters,
      },
    })
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    this.logger.error(error, {
      sql: {
        query,
        parameters,
      },
    })
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    this.logger.warn('Slow query', {
      sql: {
        time,
        query,
        parameters,
      },
    })
  }

  logSchemaBuild(message: string) {
    this.logger.debug(message, { context: 'schema' })
  }

  logMigration(message: string) {
    this.logger.debug(message, { context: 'migration' })
  }

  log(level: 'log' | 'info' | 'warn', message: any) {
    switch (level) {
      case 'log':
        this.logger.log({ level, message })
        break
      case 'info':
        this.logger.info(message)
        break
      case 'warn':
        this.logger.warn(message)
        break
      default:
        this.logger.log({ level, message })
        break
    }
  }
}
