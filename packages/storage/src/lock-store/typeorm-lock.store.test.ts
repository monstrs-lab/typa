import { createConnection } from 'typeorm'

import { TypeOrmLogger }    from '@typa/logger'

import { Lock }             from './entities'
import { TypeOrmLockStore } from './typeorm-lock.store'

const sleep = async (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout))

describe('lock-store', () => {
  describe('typeorm', () => {
    let lockStore
    let connection

    beforeEach(async () => {
      connection = await createConnection({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        dropSchema: true,
        entities: [Lock],
        logger: new TypeOrmLogger(),
      })

      lockStore = new TypeOrmLockStore(connection)
    })

    afterEach(async () => {
      await connection.close()
    })

    describe('acquireLock', () => {
      it('acquires a lock.', async () => {
        await expect(lockStore.acquireLock({ value: 'value' })).resolves.toBeUndefined()
      })

      it('throws an error if the lock is already in place.', async () => {
        await expect(lockStore.acquireLock({ value: 'value' })).resolves.toBeUndefined()
        await expect(lockStore.acquireLock({ value: 'value' })).rejects.toThrow(
          'Failed to acquire lock.'
        )
      })

      it('supports locks with different values.', async () => {
        await expect(lockStore.acquireLock({ value: 'value' })).resolves.toBeUndefined()
        await expect(lockStore.acquireLock({ value: 'other-value' })).resolves.toBeUndefined()
      })

      it('acquires a lock if the lock is already in place, but has expired.', async () => {
        await expect(
          lockStore.acquireLock({ value: 'value', expiresAt: Date.now() + 100 })
        ).resolves.toBeUndefined()
        await sleep(150)
        await expect(lockStore.acquireLock({ value: 'value' })).resolves.toBeUndefined()
      })

      it('throws an error if the expiration date is in the past.', async () => {
        await expect(
          lockStore.acquireLock({ value: 'value', expiresAt: Date.now() - 100 })
        ).rejects.toThrow('A lock must not expire in the past.')
      })
    })

    describe('isLocked', () => {
      it('returns false if the given lock does not exist.', async () => {
        await expect(lockStore.isLocked({ value: 'value' })).resolves.toBe(false)
      })

      it('returns true if the given lock exists.', async () => {
        await expect(lockStore.acquireLock({ value: 'value' })).resolves.toBeUndefined()
        await expect(lockStore.isLocked({ value: 'value' })).resolves.toBe(true)
      })

      it('returns false if the given lock exists, but has expired.', async () => {
        await expect(
          lockStore.acquireLock({ value: 'value', expiresAt: Date.now() + 100 })
        ).resolves.toBeUndefined()
        await sleep(150)
        await expect(lockStore.isLocked({ value: 'value' })).resolves.toBe(false)
      })
    })

    describe('renewLock', () => {
      it('throws an error if the given lock does not exist.', async () => {
        await expect(
          lockStore.renewLock({ value: 'does-not-exist', expiresAt: Date.now() + 100 })
        ).rejects.toThrow('Failed to renew lock.')
      })

      it('throws an error if the given lock exists, but has expired.', async () => {
        await expect(
          lockStore.acquireLock({ value: 'value-exists', expiresAt: Date.now() + 100 })
        ).resolves.toBeUndefined()

        await sleep(150)

        await expect(
          lockStore.renewLock({ value: 'value-exists', expiresAt: Date.now() + 100 })
        ).rejects.toThrow('Failed to renew lock.')
      })

      it('throws an error if the expiration date is in the past.', async () => {
        await expect(
          lockStore.acquireLock({ value: 'value-expire-past', expiresAt: Date.now() + 100 })
        ).resolves.toBeUndefined()

        await sleep(50)

        await expect(
          lockStore.acquireLock({ value: 'value-expire-past', expiresAt: Date.now() - 100 })
        ).rejects.toThrow('A lock must not expire in the past.')
      })

      it('renews the lock.', async () => {
        await expect(
          lockStore.acquireLock({ value: 'renew-value', expiresAt: Date.now() + 500 })
        ).resolves.toBeUndefined()

        await sleep(450)

        await expect(
          lockStore.renewLock({ value: 'renew-value', expiresAt: Date.now() + 500 })
        ).resolves.toBeUndefined()

        await sleep(450)

        await expect(lockStore.acquireLock({ value: 'renew-value' })).rejects.toThrow()
      })
    })

    describe('releaseLock', () => {
      it('releases the lock.', async () => {
        await expect(lockStore.acquireLock({ value: 'value' })).resolves.toBeUndefined()
        await expect(lockStore.releaseLock({ value: 'value' })).resolves.toBeUndefined()

        await expect(lockStore.acquireLock({ value: 'value' })).resolves.toBeUndefined()
      })

      it('does not throw an error if the lock does not exist.', async () => {
        await expect(lockStore.releaseLock({ value: 'value' })).resolves.toBeUndefined()
      })

      it('does not throw an error if the lock has expired.', async () => {
        await expect(
          lockStore.acquireLock({ value: 'value', expiresAt: Date.now() + 100 })
        ).resolves.toBeUndefined()

        await sleep(150)

        await expect(lockStore.releaseLock({ value: 'value' })).resolves.toBeUndefined()
      })
    })
  })
})
