import { Module }                      from '@nestjs/common'

import { TypaModule }                  from '@typa/common'
import { VideoStoreDomainModule }      from '@videostore/domain'
import { VideoStoreProjectionModule }  from '@videostore/projection'
import { VideoStoreRestAdapterModule } from '@videostore/rest-adapter'

@Module({
  imports: [
    TypaModule.register(),
    VideoStoreDomainModule,
    VideoStoreProjectionModule,
    VideoStoreRestAdapterModule,
  ],
})
export class VideostoreModule {}
