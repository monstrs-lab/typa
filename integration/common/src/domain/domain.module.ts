import { Module } from '@nestjs/common'

import { Test }   from './aggregates'

@Module({
  providers: [Test],
})
export class DomainModule {}
