import { Injectable }          from '@nestjs/common'
import { InjectRepository }    from '@nestjs/typeorm'
import { Repository }          from 'typeorm'

import { Event, EventHandler } from '@typa/common'

import { SuccessEvent }        from '../../domain'
import { TestEntity }          from '../entities'

@Injectable()
export class TestEntityProjector {
  @InjectRepository(TestEntity)
  private readonly testEntityRepository: Repository<TestEntity>

  @EventHandler(SuccessEvent)
  async onSuccessEvent(@Event event: SuccessEvent) {
    await this.testEntityRepository.save(
      this.testEntityRepository.create({
        id: event.aggregateId,
      })
    )
  }
}
