import { Module }                      from '@nestjs/common'

import { StorageType, TypaModule }     from '@typa/common'
import { VideoStoreDomainModule }      from '@videostore/domain'
import { VideoStoreProjectionModule }  from '@videostore/projection'
import { VideoStoreRestAdapterModule } from '@videostore/rest-adapter'

@Module({
  imports: [
    TypaModule.register({
      storage: {
        type: StorageType.postgres,
        host: 'localhost',
        database: 'db',
        username: 'postgres',
        password: 'password',
      },
    }),
    VideoStoreDomainModule,
    VideoStoreProjectionModule,
    VideoStoreRestAdapterModule,
  ],
})
export class VideostoreModule {}
