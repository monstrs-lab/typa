import { Module }           from '@nestjs/common'

import { TypaModule }       from '@typa/common'
import { TypaEnvConfig }    from '@typa/common'

import { DomainModule }     from './domain'
import { ProjectionModule } from './projection'

@Module({
  imports: [
    TypaModule.registerAsync({
      useClass: TypaEnvConfig,
    }),
    DomainModule,
    ProjectionModule,
  ],
})
export class IntegrationCommonModule {}
