import { Module }   from '@nestjs/common'

import { Customer } from './aggregates'
import { Film }     from './aggregates'

@Module({
  providers: [Customer, Film],
})
export class VideoStoreDomainModule {}
