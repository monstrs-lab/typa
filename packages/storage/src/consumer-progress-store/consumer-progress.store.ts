import { Injectable }                from '@nestjs/common'
import { Connection }                from 'typeorm'
import { LessThan }                  from 'typeorm'
import { UpdateResult }              from 'typeorm'
import { Repository }                from 'typeorm'
import { FindConditions }            from 'typeorm'

import { ConsumerProgress }          from './entities'
import { AggregateIdentifier }       from './wolkenkit'
import { BaseConsumerProgressStore } from './wolkenkit'
import { IsReplaying }               from './wolkenkit'
import { errors }                    from './wolkenkit'
import { getHash }                   from './wolkenkit'

@Injectable()
export class ConsumerProgressStore implements BaseConsumerProgressStore {
  constructor(private readonly connection: Connection) {}

  public async getProgress({
    consumerId,
    aggregateIdentifier,
  }: {
    consumerId: string
    aggregateIdentifier: AggregateIdentifier
  }): Promise<{ revision: number; isReplaying: IsReplaying }> {
    const hash = getHash({ value: consumerId })

    return this.connection.transaction(async (manager) => {
      const progressRepository = manager.getRepository(ConsumerProgress)

      const progress = await progressRepository.findOne({
        where: {
          consumerId: hash,
          aggregateId: aggregateIdentifier.id,
        },
      })

      if (!progress) {
        return { revision: 0, isReplaying: false }
      }

      let isReplaying: IsReplaying = false

      if (progress.isReplayingFrom && progress.isReplayingTo) {
        isReplaying = { from: progress.isReplayingFrom, to: progress.isReplayingTo }
      }

      return { revision: progress.revision, isReplaying }
    })
  }

  public async setProgress({
    consumerId,
    aggregateIdentifier,
    revision,
  }: {
    consumerId: string
    aggregateIdentifier: AggregateIdentifier
    revision: number
  }): Promise<void> {
    const hash = getHash({ value: consumerId })

    await this.connection.transaction(async (manager) => {
      const progressRepository = manager.getRepository(ConsumerProgress)

      const { affected } = await this.update(
        progressRepository,
        {
          consumerId: hash,
          aggregateId: aggregateIdentifier.id,
          revision: LessThan(revision),
        },
        {
          revision,
        }
      )

      if (affected === 1) {
        return
      }

      try {
        await progressRepository.insert({
          revision,
          consumerId: hash,
          aggregateId: aggregateIdentifier.id,
        })
      } catch (ex) {
        if (ex.code === '23505' && ex.detail?.startsWith('Key ("consumerId", "aggregateId")')) {
          throw new errors.FlowIsAlreadyReplaying()
        }

        throw ex
      }
    })
  }

  public async setIsReplaying({
    consumerId,
    aggregateIdentifier,
    isReplaying,
  }: {
    consumerId: string
    aggregateIdentifier: AggregateIdentifier
    isReplaying: IsReplaying
  }): Promise<void> {
    const hash = getHash({ value: consumerId })

    await this.connection.transaction(async (manager) => {
      const progressRepository = manager.getRepository(ConsumerProgress)

      let rowCount: any

      if (!isReplaying) {
        const { affected } = await this.update(
          progressRepository,
          {
            consumerId: hash,
            aggregateId: aggregateIdentifier.id,
          },
          {
            isReplayingFrom: null,
            isReplayingTo: null,
          }
        )

        rowCount = affected
      } else {
        const { affected } = await this.update(
          progressRepository,
          {
            consumerId: hash,
            aggregateId: aggregateIdentifier.id,
            isReplayingFrom: null,
            isReplayingTo: null,
          },
          {
            isReplayingFrom: isReplaying.from,
            isReplayingTo: isReplaying.to,
          }
        )

        rowCount = affected
      }

      if (rowCount === 1) {
        return
      }

      try {
        await progressRepository.insert({
          revision: 0,
          consumerId: hash,
          aggregateId: aggregateIdentifier.id,
          isReplayingFrom: isReplaying ? isReplaying.from : null,
          isReplayingTo: isReplaying ? isReplaying.to : null,
        })
      } catch (ex) {
        if (ex.code === '23505' && ex.detail?.startsWith('Key ("consumerId", "aggregateId")')) {
          throw new errors.FlowIsAlreadyReplaying()
        }

        throw ex
      }
    })
  }

  public async resetProgress({ consumerId }: { consumerId: string }): Promise<void> {
    const hash = getHash({ value: consumerId })

    await this.connection.transaction(async (manager) => {
      const progressRepository = manager.getRepository(ConsumerProgress)

      progressRepository.delete({
        consumerId: hash,
      })
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async destroy(): Promise<void> {}

  protected async update(
    progressRepository: Repository<ConsumerProgress>,
    criteria: FindConditions<ConsumerProgress>,
    partialEntity: Partial<ConsumerProgress>
  ): Promise<Partial<UpdateResult>> {
    if (this.connection.driver.isReturningSqlSupported()) {
      return progressRepository.update(criteria, partialEntity)
    }
    const items = await progressRepository.find({ where: criteria })

    if (items.length === 0) {
      return { affected: 0 }
    }

    items.forEach((item) => {
      Object.keys(partialEntity).forEach((key) => {
        // eslint-disable-next-line no-param-reassign
        item[key] = partialEntity[key]
      })
    })

    await progressRepository.save(items)

    return { affected: items.length }
  }
}
