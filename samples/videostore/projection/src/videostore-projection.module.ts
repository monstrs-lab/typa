import { Module }               from '@nestjs/common'

import { TypaProjectionModule } from '@typa/common'

import * as entities            from './entities'

@Module({
  imports: [
    TypaProjectionModule.register({
      entities,
    }),
  ],
})
export class VideoStoreProjectionModule {}
