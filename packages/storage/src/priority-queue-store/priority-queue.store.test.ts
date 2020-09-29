import { isEqual }                  from 'lodash'
import { createConnection }         from 'typeorm'
import { getMetadataArgsStorage }   from 'typeorm'
import { v4 as uuid }               from 'uuid'

import { TypeOrmLogger }            from '@typa/logger'

import { PriorityQueueItem }        from './entities'
import { PriorityQueue }            from './entities'
import { PriorityQueueStore }       from './priority-queue.store'
import { buildCommandWithMetadata } from './wolkenkit'

const sleep = async (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout))

getMetadataArgsStorage().columns.forEach((column) => {
  if (column.options.type === 'jsonb') {
    // eslint-disable-next-line no-param-reassign
    column.options.type = 'simple-json'
  }
})

describe('lock-store', () => {
  describe('typeorm', () => {
    let priorityQueueStore
    let connection

    const expirationTime = 250
    const firstAggregateId = uuid()
    const secondAggregateId = uuid()

    const commands = {
      firstAggregate: {
        firstCommand: buildCommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: firstAggregateId },
          name: 'execute',
          data: { strategy: 'succeed' },
          metadata: { timestamp: Date.now() + 0 },
        }),
        secondCommand: buildCommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: firstAggregateId },
          name: 'execute',
          data: { strategy: 'succeed' },
          metadata: { timestamp: Date.now() + 1 },
        }),
      },
      secondAggregate: {
        firstCommand: buildCommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: secondAggregateId },
          name: 'execute',
          data: { strategy: 'succeed' },
          metadata: { timestamp: Date.now() + 2 },
        }),
        secondCommand: buildCommandWithMetadata({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: secondAggregateId },
          name: 'execute',
          data: { strategy: 'succeed' },
          metadata: { timestamp: Date.now() + 3 },
        }),
      },
    }

    beforeEach(async () => {
      connection = await createConnection({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        dropSchema: true,
        entities: [PriorityQueueItem, PriorityQueue],
        logger: new TypeOrmLogger(),
      })

      priorityQueueStore = new PriorityQueueStore(
        connection,
        PriorityQueue,
        PriorityQueueItem,
        ({ item, itemIdentifier }): boolean => isEqual(item, itemIdentifier),
        expirationTime
      )
    })

    afterEach(async () => {
      await connection.close()
    })

    describe('enqueue', () => {
      it('enqueues the given command.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const { item: nextCommand } = (await priorityQueueStore.lockNext())!

        expect(nextCommand).toEqual(commands.firstAggregate.firstCommand)
      })

      it('enqueues the same command twice if told so.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await expect(
          priorityQueueStore.enqueue({
            item: commands.firstAggregate.firstCommand,
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            priority: commands.firstAggregate.firstCommand.metadata.timestamp,
          })
        ).resolves.toBeUndefined()
      })

      it('enqueues multiple commands for the same aggregate.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await expect(
          priorityQueueStore.enqueue({
            item: commands.firstAggregate.secondCommand,
            discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
            priority: commands.firstAggregate.secondCommand.metadata.timestamp,
          })
        ).resolves.toBeUndefined()
      })

      it('enqueues commands for multiple aggregates.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await expect(
          priorityQueueStore.enqueue({
            item: commands.secondAggregate.firstCommand,
            discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.id,
            priority: commands.secondAggregate.firstCommand.metadata.timestamp,
          })
        ).resolves.toBeUndefined()
      })

      it('enqueues commands with special characters in keys.', async () => {
        await expect(
          priorityQueueStore.enqueue({
            item: {
              'foo.bar': 'baz',
            },
            discriminator: 'foo',
            priority: commands.firstAggregate.firstCommand.metadata.timestamp,
          })
        ).resolves.toBeUndefined()
      })
    })

    describe('lockNext', () => {
      it('returns undefined if there are no enqueued items.', async () => {
        const nextCommand = await priorityQueueStore.lockNext()

        expect(nextCommand).toBeUndefined()
      })

      it('returns a previously enqueued item.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const { item: nextCommand } = (await priorityQueueStore.lockNext())!

        expect(nextCommand).toEqual(commands.firstAggregate.firstCommand)
      })

      it('returns the discriminator for the locked item.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'foo',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { discriminator },
        } = (await priorityQueueStore.lockNext())!

        expect(discriminator).toEqual('foo')
      })

      it('returns undefined if the queue of the enqueued items is locked.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.secondCommand,
          discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.secondCommand.metadata.timestamp,
        })

        await priorityQueueStore.lockNext()

        const nextCommand = await priorityQueueStore.lockNext()

        expect(nextCommand).toBeUndefined()
      })

      it('returns enqueued items for independent aggregates.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.enqueue({
          item: commands.secondAggregate.firstCommand,
          discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.secondAggregate.firstCommand.metadata.timestamp,
        })

        const { item: firstNextCommand } = (await priorityQueueStore.lockNext())!
        const { item: secondNextCommand } = (await priorityQueueStore.lockNext())!

        expect(firstNextCommand).toEqual(commands.firstAggregate.firstCommand)
        expect(secondNextCommand).toEqual(commands.secondAggregate.firstCommand)
      })

      it('returns undefined if all queues of the enqueued items are locked.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.secondCommand,
          discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.secondCommand.metadata.timestamp,
        })
        await priorityQueueStore.enqueue({
          item: commands.secondAggregate.firstCommand,
          discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.secondAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.enqueue({
          item: commands.secondAggregate.secondCommand,
          discriminator: commands.secondAggregate.secondCommand.aggregateIdentifier.id,
          priority: commands.secondAggregate.secondCommand.metadata.timestamp,
        })

        await priorityQueueStore.lockNext()
        await priorityQueueStore.lockNext()

        const nextCommand = await priorityQueueStore.lockNext()

        expect(nextCommand).toBeUndefined()
      })

      it('returns a previously locked item if its lock has expired.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const { item: firstNextCommand } = (await priorityQueueStore.lockNext())!

        await sleep(expirationTime * 1.5)

        const { item: secondNextCommand } = (await priorityQueueStore.lockNext())!

        expect(firstNextCommand).toEqual(secondNextCommand)
      })

      it('returns different tokens for each queue.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.enqueue({
          item: commands.secondAggregate.firstCommand,
          discriminator: commands.secondAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.secondAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { token: firstNextToken },
        } = (await priorityQueueStore.lockNext())!
        const {
          metadata: { token: secondNextToken },
        } = (await priorityQueueStore.lockNext())!

        expect(firstNextToken).not.toEqual(secondNextToken)
      })

      it('returns different tokens for a re-locked item whose lock had expired.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { token: firstNextToken },
        } = (await priorityQueueStore.lockNext())!

        await sleep(expirationTime * 1.5)

        const {
          metadata: { token: secondNextToken },
        } = (await priorityQueueStore.lockNext())!

        expect(firstNextToken).not.toEqual(secondNextToken)
      })

      it(`returns an item if a locked queue's until timestamp is lower than all other priorities.`, async () => {
        const item1 = { id: uuid() }
        const item2 = { id: uuid() }

        await priorityQueueStore.enqueue({
          item: item1,
          discriminator: 'queue1',
          priority: Date.now(),
        })

        await priorityQueueStore.enqueue({
          item: item2,
          discriminator: 'queue2',
          priority: Date.now() + 2 * expirationTime,
        })

        const firstLockResult = await priorityQueueStore.lockNext()

        expect(firstLockResult?.item).toEqual(item1)

        const secondLockResult = await priorityQueueStore.lockNext()

        expect(secondLockResult).toBeDefined()
        expect(secondLockResult?.item).toEqual(item2)
      })
    })

    describe('renewLock', () => {
      it('throws an error if the given item is not enqueued.', async () => {
        await expect(
          priorityQueueStore.renewLock({
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            token: 'non-existent',
          })
        ).rejects.toThrow(
          `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not found.`
        )
      })

      it('throws an error if the given item is not in a locked queue.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await expect(
          priorityQueueStore.renewLock({
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            token: 'non-existent',
          })
        ).rejects.toThrow(
          `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not locked.`
        )
      })

      it('throws an error if the given token does not match.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.lockNext()

        await expect(
          priorityQueueStore.renewLock({
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            token: 'wrong-token',
          })
        ).rejects.toThrow(
          `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}'.`
        )
      })

      it('renews the lock.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { token },
        } = (await priorityQueueStore.lockNext())!

        await sleep(expirationTime * 0.75)
        await priorityQueueStore.renewLock({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token,
        })
        await sleep(expirationTime * 0.75)

        const nextCommand = await priorityQueueStore.lockNext()

        expect(nextCommand).toBeUndefined()
      })
    })

    describe('acknowledge', () => {
      it('throws an error if the given item is not enqueued.', async () => {
        await expect(
          priorityQueueStore.acknowledge({
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            token: 'non-existent',
          })
        ).rejects.toThrow(
          `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not found.`
        )
      })

      it('throws an error if the given item is not in a locked queue.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await expect(
          priorityQueueStore.acknowledge({
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            token: 'non-existent',
          })
        ).rejects.toThrow(
          `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not locked.`
        )
      })

      it('throws an error if the given token does not match.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.lockNext()

        await expect(
          priorityQueueStore.acknowledge({
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            token: 'wrong-token',
          })
        ).rejects.toThrow(
          `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}'.`
        )
      })

      it('acknowledges the item.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.secondCommand,
          discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.secondCommand.metadata.timestamp,
        })

        const {
          metadata: { token },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token,
        })

        const { item: nextCommand } = (await priorityQueueStore.lockNext())!

        expect(nextCommand).toEqual(commands.firstAggregate.secondCommand)
      })

      it('acknowledges the last item in a queue and removes it.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { token },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token,
        })

        const shouldBeUndefined = (await priorityQueueStore.lockNext())!

        expect(shouldBeUndefined).toBeUndefined()
      })

      it('acknowledges items in a different order than they were locked.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'foo',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'bar',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { discriminator: discriminatorOne, token: tokenOne },
        } = (await priorityQueueStore.lockNext())!
        const {
          metadata: { discriminator: discriminatorTwo, token: tokenTwo },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: discriminatorTwo,
          token: tokenTwo,
        })

        await priorityQueueStore.acknowledge({
          discriminator: discriminatorOne,
          token: tokenOne,
        })
      })

      it('can queue, lock and acknowledge multiple times after each other.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'foo',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { token: tokenOne },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: 'foo',
          token: tokenOne,
        })

        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'foo',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { token: tokenTwo },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: 'foo',
          token: tokenTwo,
        })
      })

      it('can queue, lock and acknowledge across multiple discriminators.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'foo',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'bar',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { discriminator: discriminatorOne, token: tokenOne },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: discriminatorOne,
          token: tokenOne,
        })

        expect(await priorityQueueStore.lockNext()).toBeDefined()
      })

      it('can queue, lock and acknowledge across three discriminators multiple times after each other.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'foo',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'bar',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: 'baz',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { discriminator: discriminatorOne, token: tokenOne },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: discriminatorOne,
          token: tokenOne,
        })

        const {
          metadata: { discriminator: discriminatorTwo, token: tokenTwo },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: discriminatorTwo,
          token: tokenTwo,
        })

        const {
          metadata: { discriminator: discriminatorThree, token: tokenThree },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: discriminatorThree,
          token: tokenThree,
        })

        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.secondCommand,
          discriminator: 'foo',
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        const {
          metadata: { discriminator: discriminatorFour, token: tokenFour },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.acknowledge({
          discriminator: discriminatorFour,
          token: tokenFour,
        })
      })
    })

    describe('defer', () => {
      it('throws an error if the given item is not enqueued.', async () => {
        await expect(
          priorityQueueStore.defer({
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            token: 'non-existent',
            priority: commands.firstAggregate.firstCommand.metadata.timestamp,
          })
        ).rejects.toThrow(
          `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not found.`
        )
      })

      it('throws an error if the given item is not in a locked queue.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })

        await expect(
          priorityQueueStore.defer({
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            token: 'non-existent',
            priority: commands.firstAggregate.firstCommand.metadata.timestamp,
          })
        ).rejects.toThrow(
          `Item for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}' not locked.`
        )
      })

      it('throws an error if the given token does not match.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.lockNext()

        await expect(
          priorityQueueStore.defer({
            discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
            token: 'wrong-token',
            priority: commands.firstAggregate.firstCommand.metadata.timestamp,
          })
        ).rejects.toThrow(
          `Token mismatch for discriminator '${commands.firstAggregate.firstCommand.aggregateIdentifier.id}'.`
        )
      })

      it('defers the item.', async () => {
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.firstCommand,
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp,
        })
        await priorityQueueStore.enqueue({
          item: commands.firstAggregate.secondCommand,
          discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
          priority: commands.firstAggregate.secondCommand.metadata.timestamp,
        })

        const {
          metadata: { token },
        } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.defer({
          discriminator: commands.firstAggregate.firstCommand.aggregateIdentifier.id,
          token,
          priority: commands.firstAggregate.firstCommand.metadata.timestamp + 1,
        })

        const {
          item: nextCommand,
          metadata: { token: nextToken },
        } = (await priorityQueueStore.lockNext())!

        expect(nextCommand).toEqual(commands.firstAggregate.secondCommand)

        await priorityQueueStore.acknowledge({
          discriminator: commands.firstAggregate.secondCommand.aggregateIdentifier.id,
          token: nextToken,
        })

        const { item: commandAfterNextCommand } = (await priorityQueueStore.lockNext())!

        expect(commandAfterNextCommand).toEqual(commands.firstAggregate.firstCommand)
      })
    })

    describe('remove', () => {
      it('throws an error if no queue exists for the discriminator.', async () => {
        await expect(
          priorityQueueStore.remove({
            discriminator: uuid(),
            itemIdentifier: { id: uuid() },
          })
        ).rejects.toThrow()
      })

      it('throws an error if no item in the queue matches the identifier.', async () => {
        const discriminator = uuid()

        await priorityQueueStore.enqueue({ item: { id: uuid() }, discriminator, priority: 5 })

        await expect(
          priorityQueueStore.remove({
            discriminator,
            itemIdentifier: { id: uuid() },
          })
        ).rejects.toThrow()
      })

      it('throws an error if the item is in the front of the queue and currently locked.', async () => {
        const discriminator = uuid()
        const item = { id: uuid() }

        await priorityQueueStore.enqueue({ item, discriminator, priority: 5 })
        await priorityQueueStore.lockNext()

        await expect(
          priorityQueueStore.remove({
            discriminator,
            itemIdentifier: item,
          })
        ).rejects.toThrow()
      })

      it('removes the item from the front of the queue and repairs up if necessary.', async () => {
        const discriminatorOne = uuid()
        const discriminatorTwo = uuid()

        const itemPrioOne = { id: uuid() }
        const itemPrioTwo = { id: uuid() }
        const itemPrioThree = { id: uuid() }

        await priorityQueueStore.enqueue({
          item: itemPrioThree,
          discriminator: discriminatorOne,
          priority: 3,
        })
        await priorityQueueStore.enqueue({
          item: itemPrioOne,
          discriminator: discriminatorOne,
          priority: 1,
        })
        await priorityQueueStore.enqueue({
          item: itemPrioTwo,
          discriminator: discriminatorTwo,
          priority: 2,
        })

        await priorityQueueStore.remove({
          discriminator: discriminatorOne,
          itemIdentifier: itemPrioThree,
        })

        const shouldBeItemPrioOne = await priorityQueueStore.lockNext()

        expect(shouldBeItemPrioOne?.item).toEqual(itemPrioOne)
      })

      it('removes the item from the front of the queue and repairs down if necessary.', async () => {
        const discriminatorOne = uuid()
        const discriminatorTwo = uuid()

        const itemPrioOne = { id: uuid() }
        const itemPrioTwo = { id: uuid() }
        const itemPrioThree = { id: uuid() }

        await priorityQueueStore.enqueue({
          item: itemPrioOne,
          discriminator: discriminatorOne,
          priority: 1,
        })
        await priorityQueueStore.enqueue({
          item: itemPrioThree,
          discriminator: discriminatorOne,
          priority: 3,
        })
        await priorityQueueStore.enqueue({
          item: itemPrioTwo,
          discriminator: discriminatorTwo,
          priority: 2,
        })

        await priorityQueueStore.remove({
          discriminator: discriminatorOne,
          itemIdentifier: itemPrioOne,
        })

        const shouldBeItemPrioTwo = await priorityQueueStore.lockNext()

        expect(shouldBeItemPrioTwo?.item).toEqual(itemPrioTwo)
      })

      it('removes the item from anywhere else in the queue.', async () => {
        const discriminator = uuid()

        const itemPrioOne = { id: uuid() }
        const itemPrioTwo = { id: uuid() }

        await priorityQueueStore.enqueue({ item: itemPrioOne, discriminator, priority: 1 })
        await priorityQueueStore.enqueue({ item: itemPrioTwo, discriminator, priority: 2 })

        await priorityQueueStore.remove({ discriminator, itemIdentifier: itemPrioTwo })
        const shouldBeItemPrioOne = await priorityQueueStore.lockNext()

        await priorityQueueStore.acknowledge({
          discriminator,
          token: shouldBeItemPrioOne!.metadata.token,
        })
        const shouldBeUndefined = await priorityQueueStore.lockNext()

        expect(shouldBeUndefined).toBeUndefined()
      })
    })

    describe('regression tests', () => {
      it('lock, enqueue, acknowledge does not mess up the indexes.', async () => {
        await priorityQueueStore.enqueue({
          discriminator: 'foo',
          priority: Math.floor(Math.random() * 1000),
          item: { id: uuid() },
        })

        const { metadata } = (await priorityQueueStore.lockNext())!

        await priorityQueueStore.enqueue({
          discriminator: `bar`,
          priority: Math.floor(Math.random() * 1000),
          item: { id: uuid() },
        })

        await priorityQueueStore.acknowledge({
          discriminator: metadata.discriminator,
          token: metadata.token,
        })

        await priorityQueueStore.enqueue({
          discriminator: `baz`,
          priority: Math.floor(Math.random() * 1000),
          item: { index: 0 },
        })
      })
    })
  })
})
