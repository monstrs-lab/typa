import { createConnection }             from 'typeorm'
import { v4 as uuid }                   from 'uuid'

import { TypeOrmLogger }                from '@typa/logger'

import { ConsumerProgress }             from './entities'
import { TypeOrmConsumerProgressStore } from './typeorm-consumer-progress.store'
import { AggregateIdentifier }          from './wolkenkit'

describe('consumer-progress-store', () => {
  describe('typeorm', () => {
    let aggregateIdentifier: AggregateIdentifier
    let consumerId: string
    let consumerProgressStore
    let connection

    beforeEach(async () => {
      connection = await createConnection({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        dropSchema: true,
        entities: [ConsumerProgress],
        logger: new TypeOrmLogger(),
      })

      consumerProgressStore = new TypeOrmConsumerProgressStore(connection)

      aggregateIdentifier = { name: 'sampleAggregate', id: uuid() }
      consumerId = uuid()
    })

    afterEach(async () => {
      await connection.close()
    })

    describe('getProgress', () => {
      it('returns revision 0 and is replaying false for new consumers.', async () => {
        const progress = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(progress).toEqual({
          revision: 0,
          isReplaying: false,
        })
      })

      it('returns revision 0 and is replaying false for unknown aggregates.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          revision: 1,
        })

        const progress = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(progress).toEqual({ revision: 0, isReplaying: false })
      })

      it('returns 0 and is replaying false for new consumers even if the aggregate is known to other consumers.', async () => {
        await consumerProgressStore.setProgress({
          consumerId: uuid(),
          aggregateIdentifier,
          revision: 1,
        })

        const progress = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(progress).toEqual({ revision: 0, isReplaying: false })
      })

      it('returns the revision for known aggregates.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })

        const { revision } = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(revision).toBe(1)
      })
    })

    describe('setProgress', () => {
      it('sets the revision for new consumers.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })

        const { revision } = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(revision).toBe(1)
      })

      it('sets the revision for new aggregates.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })

        const { revision } = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(revision).toBe(1)
      })

      it('updates the revision for known aggregates.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })

        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 2,
        })

        const { revision } = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(revision).toBe(2)
      })

      it('does not update the revision if the revision stayed the same.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })

        await expect(
          consumerProgressStore.setProgress({
            consumerId,
            aggregateIdentifier,
            revision: 1,
          })
        ).rejects.toThrow()
      })

      it('does not update the revision if the revision decreased.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 2,
        })

        await expect(
          consumerProgressStore.setProgress({
            consumerId,
            aggregateIdentifier,
            revision: 1,
          })
        ).rejects.toThrow()
      })

      it('does not update the replaying state.', async () => {
        await consumerProgressStore.setIsReplaying({
          consumerId,
          aggregateIdentifier,
          isReplaying: { from: 7, to: 9 },
        })

        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 2,
        })

        const { isReplaying } = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(isReplaying).toEqual({ from: 7, to: 9 })
      })
    })

    describe('setIsReplaying', () => {
      it('sets the is replaying value for new consumers.', async () => {
        await consumerProgressStore.setIsReplaying({
          consumerId,
          aggregateIdentifier,
          isReplaying: { from: 5, to: 7 },
        })

        const progress = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(progress).toEqual({
          revision: 0,
          isReplaying: { from: 5, to: 7 },
        })
      })

      it('sets the is replaying value for known aggregates.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })

        await consumerProgressStore.setIsReplaying({
          consumerId,
          aggregateIdentifier,
          isReplaying: { from: 7, to: 9 },
        })

        const progress = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(progress).toEqual({
          revision: 1,
          isReplaying: { from: 7, to: 9 },
        })
      })

      it('throws an error if an aggregate is already replaying.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })

        await consumerProgressStore.setIsReplaying({
          consumerId,
          aggregateIdentifier,
          isReplaying: { from: 7, to: 9 },
        })

        await expect(
          consumerProgressStore.setIsReplaying({
            consumerId,
            aggregateIdentifier,
            isReplaying: { from: 2, to: 20 },
          })
        ).rejects.toThrow()
      })

      it('does not change the revision when enabling replays.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 5,
        })

        await consumerProgressStore.setIsReplaying({
          consumerId,
          aggregateIdentifier,
          isReplaying: { from: 7, to: 9 },
        })

        const { revision } = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(revision).toBe(5)
      })

      it('does not change the revision when disabling replays.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 5,
        })

        await consumerProgressStore.setIsReplaying({
          consumerId,
          aggregateIdentifier,
          isReplaying: false,
        })

        const { revision } = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(revision).toBe(5)
      })
    })

    describe('resetProgress', () => {
      it('resets the revisions for the given consumer.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })

        await consumerProgressStore.resetProgress({ consumerId })

        const { revision } = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(revision).toBe(0)
      })

      it('stops an ongoing replay.', async () => {
        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })
        await consumerProgressStore.setIsReplaying({
          consumerId,
          aggregateIdentifier,
          isReplaying: { from: 5, to: 7 },
        })

        await consumerProgressStore.resetProgress({ consumerId })

        const progress = await consumerProgressStore.getProgress({
          consumerId,
          aggregateIdentifier,
        })

        expect(progress.isReplaying).toBe(false)
      })

      it('does not reset the revisions for other consumers.', async () => {
        const otherConsumerId = uuid()

        await consumerProgressStore.setProgress({
          consumerId,
          aggregateIdentifier,
          revision: 1,
        })

        await consumerProgressStore.setProgress({
          consumerId: otherConsumerId,
          aggregateIdentifier,
          revision: 1,
        })

        await consumerProgressStore.resetProgress({ consumerId })

        const { revision } = await consumerProgressStore.getProgress({
          consumerId: otherConsumerId,
          aggregateIdentifier,
        })

        expect(revision).toBe(1)
      })

      it('does not reset anything for an unknown consumer.', async () => {
        const otherConsumerId = uuid()

        await consumerProgressStore.setProgress({
          consumerId: otherConsumerId,
          aggregateIdentifier,
          revision: 1,
        })

        await expect(consumerProgressStore.resetProgress({ consumerId })).resolves.toBeUndefined()
      })
    })
  })
})
