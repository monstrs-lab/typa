import { Inject, Injectable }          from '@nestjs/common'
import { TypeOrmOptionsFactory }       from '@nestjs/typeorm'
import { TypeOrmModuleOptions }        from '@nestjs/typeorm'

import { TypeOrmLogger }               from '@typa/logger'

import { StorageModuleOptions }        from './interfaces'
import { TYPA_STORAGE_MODULE_OPTIONS } from './storage.constants'

@Injectable()
export class TypeOrmConfig implements TypeOrmOptionsFactory {
  constructor(
    @Inject(TYPA_STORAGE_MODULE_OPTIONS) private readonly options: StorageModuleOptions
  ) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    if (this.options?.type === 'postgres') {
      return {
        type: 'postgres',
        database: this.options.database,
        host: this.options.host,
        port: this.options.port,
        username: this.options.username,
        password: this.options.password,
        entityPrefix: this.options.entityPrefix,
        logger: new TypeOrmLogger(),
        migrationsRun: true,
        migrations: [], // TODO: sync migrations
        synchronize: false,
        dropSchema: false,
        entities: [],
      }
    }

    return {
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
      logger: new TypeOrmLogger(),
      entities: [],
    }
  }
}
