import { Module }               from '@nestjs/common'

import { TypaProjectionModule } from '@typa/common'

import * as entities            from './entities'
import * as migrations          from './migrations'
import { CustomerProjector }    from './projectors'
import { FilmProjector }        from './projectors'
import { CustomerQueryHandler } from './queries'
import { FilmQueryHandler }     from './queries'

@Module({
  imports: [
    TypaProjectionModule.register({
      entities,
      migrations,
    }),
  ],
  providers: [CustomerProjector, CustomerQueryHandler, FilmProjector, FilmQueryHandler],
})
export class VideoStoreProjectionModule {}
