import { Module }               from '@nestjs/common'

import { TypaProjectionModule } from '@typa/common'

import * as entities            from './entities'
import * as migrations          from './migrations'
import { CustomerProjector }    from './projectors'
import { CustomerQueryHandler } from './queries'

@Module({
  imports: [
    TypaProjectionModule.register({
      entities,
      migrations,
    }),
  ],
  providers: [CustomerProjector, CustomerQueryHandler],
})
export class VideoStoreProjectionModule {}
