import { Module }                 from '@nestjs/common'

import { TypaProjectionModule }   from '@typa/common'

import * as entities              from './entities'
import * as migrations            from './migrations'
import { TestEntityProjector }    from './projectors'
import { TestEntityQueryHandler } from './queries'

@Module({
  imports: [
    TypaProjectionModule.register({
      entities,
      migrations,
    }),
  ],
  providers: [TestEntityProjector, TestEntityQueryHandler],
})
export class ProjectionModule {}
