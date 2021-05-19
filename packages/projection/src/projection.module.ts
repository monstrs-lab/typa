import { DynamicModule, Module }   from '@nestjs/common'
import { TypeOrmModule }           from '@nestjs/typeorm'

import { MigrationsStorage }       from '@typa/storage'
import { EntitiesStorage }         from '@typa/storage'

import { ProjectionModuleOptions } from './projection-module-options.interface'

@Module({})
export class TypaProjectionModule {
  static register({ entities = [], migrations = [] }: ProjectionModuleOptions): DynamicModule {
    MigrationsStorage.addMigrations(migrations)
    EntitiesStorage.addEntities(entities)

    return TypeOrmModule.forFeature(Array.isArray(entities) ? entities : Object.values(entities))
  }
}
