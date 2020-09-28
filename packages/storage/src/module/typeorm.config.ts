/* eslint-disable import/named */

import { Inject, Injectable }                                from '@nestjs/common'
import { TypeOrmOptionsFactory }                             from '@nestjs/typeorm'
import { TypeOrmModuleOptions }                              from '@nestjs/typeorm'

import { TypeOrmLogger }                                     from '@typa/logger'

import { Lock }                                              from '../lock-store'
import { MigrationsStorage }                                 from './migrations.storage'
import { StorageModuleOptions }                              from './storage-module-options.interface'
import { PostgresStorageOptions }                            from './storage-module-options.interface'
import { TYPA_STORAGE_MODULE_OPTIONS }                       from './storage.constants'
import { postgresMigrations as lockStorePostgresMigrations } from '../lock-store'

@Injectable()
export class TypeOrmConfig implements TypeOrmOptionsFactory {
  constructor(
    @Inject(TYPA_STORAGE_MODULE_OPTIONS) private readonly options: StorageModuleOptions
  ) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    if (this.options?.type === 'postgres') {
      return this.createPostgresOptions(this.options)
    }

    return this.createSqliteOptions()
  }

  protected createPostgresOptions(options: PostgresStorageOptions): TypeOrmModuleOptions {
    MigrationsStorage.addMigrations(lockStorePostgresMigrations)

    return {
      type: 'postgres',
      database: options.database,
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      entityPrefix: options.entityPrefix,
      logger: new TypeOrmLogger(),
      migrations: MigrationsStorage.getMigrations(),
      migrationsRun: true,
      synchronize: false,
      dropSchema: false,
      entities: [Lock],
    }
  }

  protected createSqliteOptions(): TypeOrmModuleOptions {
    return {
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
      logger: new TypeOrmLogger(),
      migrations: MigrationsStorage.getMigrations(),
      migrationsRun: true,
      entities: [Lock],
    }
  }
}
