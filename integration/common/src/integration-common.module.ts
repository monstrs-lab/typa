import { Module }       from '@nestjs/common'

import { TypaModule }   from '@typa/common'

import { DomainModule } from './domain'

@Module({
  imports: [
    TypaModule.register({
      storage: {
        type: 'postgres',
        host: 'localhost',
        database: 'db',
        username: 'postgres',
        password: 'password',
      },
    }),
    DomainModule,
  ],
})
export class IntegrationCommonModule {}
