import { Module }        from '@nestjs/common'

import { TypaModule }    from '@typa/common'
import { TypaEnvConfig } from '@typa/common'

import { DomainModule }  from './domain'

@Module({
  imports: [
    TypaModule.registerAsync({
      useClass: TypaEnvConfig,
    }),
    DomainModule,
  ],
})
export class IntegrationCommonModule {}
