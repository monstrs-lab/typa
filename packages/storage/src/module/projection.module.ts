import { DynamicModule, Module }   from '@nestjs/common'
import { TypeOrmModule }           from '@nestjs/typeorm'

import { MigrationsStorage }       from './migrations.storage'
import { ProjectionModuleOptions } from './projection-module-options.interface'

@Module({})
export class TypaProjectionModule {
  static register({ entities = [], migrations = [] }: ProjectionModuleOptions): DynamicModule {
    MigrationsStorage.addMigrations(migrations)

    return {
      module: TypaProjectionModule,
      imports: [TypeOrmModule.forFeature(entities)],
    }
  }
}
