import { InjectRepository }       from '@nestjs/typeorm'
import { Repository }             from 'typeorm'

import { Query, QueryHandler }    from '@typa/common'

import { GetTestEntityByIdQuery } from '../../domain'
import { TestEntity }             from '../entities'

export class TestEntityQueryHandler {
  @InjectRepository(TestEntity)
  private readonly testEntityRepository: Repository<TestEntity>

  @QueryHandler(GetTestEntityByIdQuery)
  getTestEntityById(@Query query: GetTestEntityByIdQuery) {
    return this.testEntityRepository.findOne(query.id)
  }
}
