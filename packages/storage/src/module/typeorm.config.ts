/* eslint-disable import/named */

import { Inject, Injectable }           from '@nestjs/common'
import { TypeOrmOptionsFactory }        from '@nestjs/typeorm'
import { TypeOrmModuleOptions }         from '@nestjs/typeorm'
import { getMetadataArgsStorage }       from 'typeorm'

import { TypeOrmLogger }                from '@typa/logger'

import * as migrations                  from './typeorm.migrations'
import { ConsumerProgress }             from '../consumer-progress-store'
import { DomainEventSnapshot }          from '../domain-event-store'
import { DomainEvent }                  from '../domain-event-store'
import { Lock }                         from '../lock-store'
import { CommandPriorityQueueItem }     from '../priority-queue-store'
import { CommandPriorityQueue }         from '../priority-queue-store'
import { DomainEventPriorityQueueItem } from '../priority-queue-store'
import { DomainEventPriorityQueue }     from '../priority-queue-store'
import { MigrationsStorage }            from './migrations.storage'
import { StorageModuleOptions }         from './storage-module-options.interface'
import { PostgresStorageOptions }       from './storage-module-options.interface'
import { TYPA_STORAGE_MODULE_OPTIONS }  from './storage.constants'

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
    MigrationsStorage.addMigrations(migrations)

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
      entities: [
        Lock,
        ConsumerProgress,
        DomainEventSnapshot,
        DomainEvent,
        CommandPriorityQueueItem,
        CommandPriorityQueue,
        DomainEventPriorityQueueItem,
        DomainEventPriorityQueue,
      ],
    }
  }

  protected createSqliteOptions(): TypeOrmModuleOptions {
    getMetadataArgsStorage().columns.forEach((column) => {
      if (column.options.type === 'jsonb') {
        // eslint-disable-next-line no-param-reassign
        column.options.type = 'simple-json'
      }
    })

    return {
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
      logger: new TypeOrmLogger(),
      migrations: MigrationsStorage.getMigrations(),
      migrationsRun: true,
      entities: [
        Lock,
        ConsumerProgress,
        DomainEventSnapshot,
        DomainEvent,
        CommandPriorityQueueItem,
        CommandPriorityQueue,
        DomainEventPriorityQueueItem,
        DomainEventPriorityQueue,
      ],
    }
  }
}
