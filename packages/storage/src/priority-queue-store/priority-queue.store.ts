import PQueue                      from 'p-queue'
import { Connection, MoreThan }    from 'typeorm'
import { Repository }              from 'typeorm'
import { v4 as uuid }              from 'uuid'

import { PriorityQueueItem }       from './entities'
import { PriorityQueue }           from './entities'
import { Queue }                   from './queue.interface'
import { DoesIdentifierMatchItem } from './wolkenkit'
import { LockMetadata }            from './wolkenkit'
import { BasePriorityQueueStore }  from './wolkenkit'
import { errors }                  from './wolkenkit'
import { getIndexOfLeftChild }     from './wolkenkit'
import { getIndexOfParent }        from './wolkenkit'
import { getIndexOfRightChild }    from './wolkenkit'

export class PriorityQueueStore<TItem, TItemIdentifier>
  implements BasePriorityQueueStore<TItem, TItemIdentifier> {
  protected doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>

  protected expirationTime: number

  protected functionCallQueue: PQueue

  protected static getPriority({ queue }: { queue: Queue }): number {
    if (queue.lock && queue.lock.until > Date.now()) {
      return Number.MAX_SAFE_INTEGER
    }

    return queue.priority
  }

  constructor(
    private readonly connection: Connection,
    private readonly priorityQueueEntity: typeof PriorityQueue,
    private readonly priorityQueueItemEntity: typeof PriorityQueueItem,
    doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>,
    expirationTime: number = 15_000
  ) {
    this.doesIdentifierMatchItem = doesIdentifierMatchItem
    this.expirationTime = expirationTime
    this.functionCallQueue = new PQueue({ concurrency: 1 })
  }

  protected async swapPositionsInPriorityQueue({
    firstQueue,
    secondQueue,
    priorityQueue,
    priorityQueueItem,
  }: {
    firstQueue: Queue
    secondQueue: Queue
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<void> {
    await priorityQueue.update(
      {
        discriminator: firstQueue.discriminator,
      },
      {
        indexInPriorityQueue: -1,
      }
    )

    await priorityQueue.update(
      {
        discriminator: secondQueue.discriminator,
      },
      {
        indexInPriorityQueue: firstQueue.index,
      }
    )

    await priorityQueue.update(
      {
        discriminator: firstQueue.discriminator,
      },
      {
        indexInPriorityQueue: secondQueue.index,
      }
    )
  }

  protected async repairUp({
    discriminator,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({
      discriminator,
      priorityQueue,
      priorityQueueItem,
    })

    if (!queue) {
      throw new errors.InvalidOperation()
    }

    if (queue.index === 0) {
      return
    }

    const parentIndex = getIndexOfParent({ index: queue.index })
    const parentQueue = (await this.getQueueByIndexInPriorityQueue({
      indexInPriorityQueue: parentIndex,
      priorityQueue,
      priorityQueueItem,
    }))!

    const queuePriority = PriorityQueueStore.getPriority({ queue })
    const parentQueuePriority = PriorityQueueStore.getPriority({ queue: parentQueue })

    if (parentQueuePriority <= queuePriority) {
      return
    }

    await this.swapPositionsInPriorityQueue({
      firstQueue: queue,
      secondQueue: parentQueue,
      priorityQueue,
      priorityQueueItem,
    })

    await this.repairUp({ discriminator: queue.discriminator, priorityQueue, priorityQueueItem })
  }

  protected async repairDown({
    discriminator,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({
      discriminator,
      priorityQueue,
      priorityQueueItem,
    })

    if (!queue) {
      throw new errors.InvalidOperation()
    }

    const leftChildIndex = getIndexOfLeftChild({ index: queue.index })
    const rightChildIndex = getIndexOfRightChild({ index: queue.index })

    const leftChildQueue = await this.getQueueByIndexInPriorityQueue({
      indexInPriorityQueue: leftChildIndex,
      priorityQueue,
      priorityQueueItem,
    })

    if (!leftChildQueue) {
      // If no left child is found, there is no layer beneath the current queue
      // and we can stop here.
      return
    }

    const rightChildQueue = await this.getQueueByIndexInPriorityQueue({
      indexInPriorityQueue: rightChildIndex,
      priorityQueue,
      priorityQueueItem,
    })

    const queuePriority = PriorityQueueStore.getPriority({ queue })

    const leftChildQueuePriority = PriorityQueueStore.getPriority({ queue: leftChildQueue })
    const rightChildQueuePriority = rightChildQueue
      ? PriorityQueueStore.getPriority({ queue: rightChildQueue })
      : Number.MAX_SAFE_INTEGER

    if (queuePriority <= leftChildQueuePriority && queuePriority <= rightChildQueuePriority) {
      return
    }

    if (leftChildQueuePriority <= rightChildQueuePriority) {
      await this.swapPositionsInPriorityQueue({
        firstQueue: queue,
        secondQueue: leftChildQueue,
        priorityQueue,
        priorityQueueItem,
      })
    } else {
      await this.swapPositionsInPriorityQueue({
        firstQueue: queue,
        secondQueue: rightChildQueue!,
        priorityQueue,
        priorityQueueItem,
      })
    }

    await this.repairDown({ discriminator: queue.discriminator, priorityQueue, priorityQueueItem })
  }

  protected async removeQueueInternal({
    discriminator,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<void> {
    const rows = await priorityQueue.find({
      where: { discriminator },
    })

    if (rows.length === 0) {
      throw new errors.InvalidOperation()
    }

    await priorityQueue.delete({ discriminator })

    const count = await priorityQueue.count()

    if (rows[0].indexInPriorityQueue >= count) {
      return
    }

    await priorityQueue.update(
      {
        indexInPriorityQueue: count,
      },
      {
        indexInPriorityQueue: rows[0].indexInPriorityQueue,
      }
    )

    // @ts-ignore
    const { discriminator: movedQueueDiscriminator } = await priorityQueue.findOne({
      where: {
        indexInPriorityQueue: rows[0].indexInPriorityQueue,
      },
    })

    await this.repairDown({
      discriminator: movedQueueDiscriminator,
      priorityQueue,
      priorityQueueItem,
    })
  }

  protected async getQueueByDiscriminator({
    discriminator,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<Queue | undefined> {
    const pq = await priorityQueue
      .createQueryBuilder('pq')
      .select('pq."indexInPriorityQueue"', 'indexInPriorityQueue')
      .addSelect('pq."lockUntil"', 'lockUntil')
      .addSelect('pq."lockToken"', 'lockToken')
      .addSelect('i."priority"', 'priority')
      .leftJoinAndSelect(priorityQueueItem.target, 'i', 'pq."discriminator" = i."discriminator"')
      .where('pq."discriminator" = :discriminator', { discriminator })
      .getRawOne()

    if (!pq) {
      return
    }

    const queue: Queue = {
      discriminator,
      index: pq.indexInPriorityQueue,
      priority: pq.priority,
    }

    if (pq.lockUntil) {
      queue.lock = {
        until: pq.lockUntil,
        token: pq.lockToken.toString(),
      }
    }

    // eslint-disable-next-line consistent-return
    return queue
  }

  protected async getQueueByIndexInPriorityQueue({
    indexInPriorityQueue,
    priorityQueue,
    priorityQueueItem,
  }: {
    indexInPriorityQueue: number
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<Queue | undefined> {
    const pq = await priorityQueue
      .createQueryBuilder('pq')
      .select('pq."discriminator"', 'discriminator')
      .addSelect('pq."lockUntil"', 'lockUntil')
      .addSelect('pq."lockToken"', 'lockToken')
      .addSelect('i."priority"', 'priority')
      .leftJoinAndSelect(priorityQueueItem.target, 'i', 'pq."discriminator" = i."discriminator"')
      .where('pq."indexInPriorityQueue" = :indexin', { indexin: indexInPriorityQueue })
      .andWhere('i."indexInQueue" = 0')
      .getRawOne()

    if (!pq) {
      return
    }

    const queue: Queue = {
      discriminator: pq.discriminator,
      index: indexInPriorityQueue,
      priority: pq.priority,
    }

    if (pq.lockUntil) {
      queue.lock = {
        until: pq.lockUntil,
        token: pq.lockToken.toString(),
      }
    }

    // eslint-disable-next-line consistent-return
    return queue
  }

  protected async getFirstItemInQueue({
    discriminator,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<TItem> {
    const { item }: any = await priorityQueueItem.findOne({
      where: {
        discriminator,
      },
      order: {
        indexInQueue: 'ASC',
      },
    })

    if (!item) {
      throw new errors.InvalidOperation()
    }

    return item
  }

  protected async getQueueIfLocked({
    discriminator,
    token,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    token: string
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<Queue> {
    const queue = await this.getQueueByDiscriminator({
      discriminator,
      priorityQueue,
      priorityQueueItem,
    })

    if (!queue) {
      throw new errors.ItemNotFound(`Item for discriminator '${discriminator}' not found.`)
    }

    if (!queue.lock) {
      throw new errors.ItemNotLocked(`Item for discriminator '${discriminator}' not locked.`)
    }
    if (queue.lock.token !== token) {
      throw new errors.TokenMismatch(`Token mismatch for discriminator '${discriminator}'.`)
    }

    return queue
  }

  protected async enqueueInternal({
    item,
    discriminator,
    priority,
    priorityQueue,
    priorityQueueItem,
  }: {
    item: TItem
    discriminator: string
    priority: number
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<void> {
    const { nextIndexInQueue } = await priorityQueueItem
      .createQueryBuilder('i')
      .select('COALESCE(MAX(i."indexInQueue") + 1, 0)', 'nextIndexInQueue')
      .where('i."discriminator" = :discriminator', { discriminator })
      .getRawOne()

    await priorityQueueItem.insert({
      discriminator,
      indexInQueue: nextIndexInQueue,
      priority,
      item,
    })

    const rows: any[] = await priorityQueue.find({
      where: {
        discriminator,
      },
    })

    if (rows.length > 0) {
      return
    }

    const { nextIndexInPriorityQueue } = await priorityQueue
      .createQueryBuilder('pq')
      .select('COALESCE(MAX(pq."indexInPriorityQueue") + 1, 0)', 'nextIndexInPriorityQueue')
      .getRawOne()

    await priorityQueue.insert({
      discriminator,
      indexInPriorityQueue: nextIndexInPriorityQueue,
    })

    await this.repairUp({ discriminator, priorityQueue, priorityQueueItem })
  }

  public async enqueue({
    item,
    discriminator,
    priority,
  }: {
    item: TItem
    discriminator: string
    priority: number
  }): Promise<void> {
    await this.functionCallQueue.add(() =>
      this.connection.transaction(async (manager) => {
        const priorityQueue = manager.getRepository(this.priorityQueueEntity)
        const priorityQueueItem = manager.getRepository(this.priorityQueueItemEntity)

        return this.enqueueInternal({
          item,
          discriminator,
          priority,
          priorityQueue,
          priorityQueueItem,
        })
      })
    )
  }

  protected async lockNextInternal({
    priorityQueue,
    priorityQueueItem,
  }: {
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<{ item: TItem; metadata: LockMetadata } | undefined> {
    const pq = await priorityQueue
      .createQueryBuilder('pq')
      .where('pq."lockUntil" IS NULL')
      .orWhere('pq."lockUntil" <= :date', { date: Date.now() })
      .orderBy('pq."indexInPriorityQueue"', 'ASC')
      .getOne()

    if (!pq) {
      return
    }

    const { discriminator } = pq

    const item = await this.getFirstItemInQueue({ discriminator, priorityQueue, priorityQueueItem })

    const until = Date.now() + this.expirationTime
    const token = uuid()

    await priorityQueue.update(
      {
        discriminator,
      },
      {
        lockUntil: until,
        lockToken: token,
      }
    )

    await this.repairDown({ discriminator, priorityQueue, priorityQueueItem })

    // eslint-disable-next-line consistent-return
    return { item, metadata: { discriminator, token } }
  }

  public async lockNext(): Promise<{ item: TItem; metadata: LockMetadata } | undefined> {
    return this.functionCallQueue.add(() =>
      this.connection.transaction(async (manager) => {
        const priorityQueue = manager.getRepository(this.priorityQueueEntity)
        const priorityQueueItem = manager.getRepository(this.priorityQueueItemEntity)

        return this.lockNextInternal({ priorityQueue, priorityQueueItem })
      })
    )
  }

  protected async renewLockInternal({
    discriminator,
    token,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    token: string
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({
      discriminator,
      token,
      priorityQueue,
      priorityQueueItem,
    })
    const newUntil = Date.now() + this.expirationTime

    await priorityQueue.update(
      {
        discriminator: queue.discriminator,
      },
      {
        lockUntil: newUntil,
      }
    )

    await this.repairDown({ discriminator: queue.discriminator, priorityQueue, priorityQueueItem })
  }

  public async renewLock({
    discriminator,
    token,
  }: {
    discriminator: string
    token: string
  }): Promise<void> {
    await this.functionCallQueue.add(() =>
      this.connection.transaction(async (manager) => {
        const priorityQueue = manager.getRepository(this.priorityQueueEntity)
        const priorityQueueItem = manager.getRepository(this.priorityQueueItemEntity)

        return this.renewLockInternal({ discriminator, token, priorityQueue, priorityQueueItem })
      })
    )
  }

  protected async acknowledgeInternal({
    discriminator,
    token,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    token: string
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({
      discriminator,
      token,
      priorityQueue,
      priorityQueueItem,
    })

    await priorityQueueItem.delete({
      discriminator: queue.discriminator,
      indexInQueue: 0,
    })

    let affected = 0

    if (this.connection.driver.isReturningSqlSupported()) {
      const updateResult = await priorityQueueItem.decrement(
        { discriminator: queue.discriminator },
        'indexInQueue',
        1
      )

      // @ts-ignore
      affected = updateResult.affected
    } else {
      await priorityQueueItem.update(
        {
          discriminator: queue.discriminator,
        },
        {
          indexInQueue: () => '"indexInQueue" - 1',
        }
      )

      affected = await priorityQueueItem.count({
        discriminator: queue.discriminator,
      })
    }

    if (affected > 0) {
      await priorityQueue.update(
        {
          discriminator: queue.discriminator,
        },
        {
          lockUntil: null,
          lockToken: null,
        }
      )

      await this.repairDown({
        discriminator: queue.discriminator,
        priorityQueue,
        priorityQueueItem,
      })

      return
    }

    await this.removeQueueInternal({
      discriminator: queue.discriminator,
      priorityQueue,
      priorityQueueItem,
    })
  }

  public async acknowledge({
    discriminator,
    token,
  }: {
    discriminator: string
    token: string
  }): Promise<void> {
    await this.functionCallQueue.add(() =>
      this.connection.transaction(async (manager) => {
        const priorityQueue = manager.getRepository(this.priorityQueueEntity)
        const priorityQueueItem = manager.getRepository(this.priorityQueueItemEntity)

        return this.acknowledgeInternal({ discriminator, token, priorityQueue, priorityQueueItem })
      })
    )
  }

  protected async deferInternal({
    discriminator,
    token,
    priority,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    token: string
    priority: number
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<void> {
    const queue = await this.getQueueIfLocked({
      discriminator,
      token,
      priorityQueue,
      priorityQueueItem,
    })

    const item = await this.getFirstItemInQueue({
      discriminator: queue.discriminator,
      priorityQueue,
      priorityQueueItem,
    })

    await this.acknowledgeInternal({
      discriminator: queue.discriminator,
      token,
      priorityQueue,
      priorityQueueItem,
    })
    await this.enqueueInternal({
      item,
      discriminator: queue.discriminator,
      priority,
      priorityQueue,
      priorityQueueItem,
    })
  }

  public async defer({
    discriminator,
    token,
    priority,
  }: {
    discriminator: string
    token: string
    priority: number
  }): Promise<void> {
    await this.functionCallQueue.add(() =>
      this.connection.transaction(async (manager) => {
        const priorityQueue = manager.getRepository(this.priorityQueueEntity)
        const priorityQueueItem = manager.getRepository(this.priorityQueueItemEntity)

        return this.deferInternal({
          discriminator,
          token,
          priority,
          priorityQueue,
          priorityQueueItem,
        })
      })
    )
  }

  protected async removeInternal({
    discriminator,
    itemIdentifier,
    priorityQueue,
    priorityQueueItem,
  }: {
    discriminator: string
    itemIdentifier: TItemIdentifier
    priorityQueue: Repository<PriorityQueue>
    priorityQueueItem: Repository<PriorityQueueItem>
  }): Promise<void> {
    const queue = await this.getQueueByDiscriminator({
      discriminator,
      priorityQueue,
      priorityQueueItem,
    })

    if (!queue) {
      throw new errors.ItemNotFound()
    }

    const rows = await priorityQueueItem.find({
      where: {
        discriminator,
      },
      order: {
        indexInQueue: 'ASC',
      },
    })

    const items = rows.map(({ item }: { item: TItem }): TItem => item)

    const foundItemIndex = items.findIndex((item: TItem): boolean =>
      this.doesIdentifierMatchItem({ item, itemIdentifier })
    )

    if (foundItemIndex === -1) {
      throw new errors.ItemNotFound()
    }

    if (foundItemIndex === 0) {
      if (queue?.lock && queue.lock.until > Date.now()) {
        throw new errors.ItemNotFound()
      }

      if (items.length === 1) {
        await this.removeQueueInternal({ discriminator, priorityQueue, priorityQueueItem })

        return
      }

      await priorityQueueItem.delete({
        discriminator: queue.discriminator,
        indexInQueue: 0,
      })

      await priorityQueueItem.decrement({ discriminator: queue.discriminator }, 'indexInQueue', 1)

      await this.repairDown({
        discriminator: queue.discriminator,
        priorityQueue,
        priorityQueueItem,
      })

      await this.repairUp({ discriminator: queue.discriminator, priorityQueue, priorityQueueItem })

      return
    }

    await priorityQueueItem.delete({
      discriminator: queue.discriminator,
      indexInQueue: foundItemIndex,
    })

    await priorityQueueItem.decrement(
      { discriminator: queue.discriminator, indexInQueue: MoreThan(foundItemIndex) },
      'indexInQueue',
      1
    )
  }

  public async remove({
    discriminator,
    itemIdentifier,
  }: {
    discriminator: string
    itemIdentifier: TItemIdentifier
  }): Promise<void> {
    await this.functionCallQueue.add(() =>
      this.connection.transaction(async (manager) => {
        const priorityQueue = manager.getRepository(this.priorityQueueEntity)
        const priorityQueueItem = manager.getRepository(this.priorityQueueItemEntity)

        return this.removeInternal({
          discriminator,
          itemIdentifier,
          priorityQueue,
          priorityQueueItem,
        })
      })
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async destroy(): Promise<void> {}
}
