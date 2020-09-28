import { Injectable }      from '@nestjs/common'
import { Connection }      from 'typeorm'
import { Repository }      from 'typeorm'
import { LessThan }        from 'typeorm'
import { MoreThanOrEqual } from 'typeorm'

import { Lock }            from './entities'
import { LockStore }       from './wolkenkit'
import { errors }          from './wolkenkit'
import { getHash }         from './wolkenkit'

@Injectable()
export class TypeOrmLockStore implements LockStore {
  constructor(private readonly connection: Connection) {}

  protected async removeExpiredLocks({
    lockRepository,
  }: {
    lockRepository: Repository<Lock>
  }): Promise<void | any> {
    return lockRepository.delete({
      expiresAt: LessThan(Date.now()),
    })
  }

  public async acquireLock({
    value,
    expiresAt = Number.MAX_SAFE_INTEGER,
  }: {
    value: string
    expiresAt?: number
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.')
    }

    return this.connection.transaction(async (manager) => {
      const lockRepository = manager.getRepository(Lock)
      const hash = getHash({ value })

      await this.removeExpiredLocks({ lockRepository })

      try {
        await lockRepository.insert({
          value: hash,
          expiresAt,
        })
      } catch {
        throw new errors.LockAcquireFailed('Failed to acquire lock.')
      }
    })
  }

  public async isLocked({ value }: { value: string }): Promise<boolean> {
    return this.connection.transaction(async (manager) => {
      const lockRepository = manager.getRepository(Lock)
      const hash = getHash({ value })

      const lock = await lockRepository.findOne({
        where: {
          value: hash,
          expiresAt: MoreThanOrEqual(Date.now()),
        },
      })

      if (!lock) {
        return false
      }

      return true
    })
  }

  public async renewLock({
    value,
    expiresAt,
  }: {
    value: string
    expiresAt: number
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.')
    }

    const hash = getHash({ value })

    await this.connection.transaction(async (manager) => {
      const lockRepository = manager.getRepository(Lock)

      await this.removeExpiredLocks({ lockRepository })

      if (this.connection.driver.isReturningSqlSupported()) {
        const { affected } = await lockRepository.update(
          {
            value: hash,
          },
          {
            expiresAt,
          }
        )

        if (!affected || affected === 0) {
          throw new errors.LockRenewalFailed('Failed to renew lock.')
        }
      } else {
        const lock = await lockRepository.findOne({ where: { value: hash } })

        if (!lock) {
          throw new errors.LockRenewalFailed('Failed to renew lock.')
        }

        lock.expiresAt = expiresAt

        await lockRepository.save(lock)
      }
    })
  }

  public async releaseLock({ value }: { value: string }): Promise<void> {
    const hash = getHash({ value })

    await this.connection.transaction(async (manager) => {
      const lockRepository = manager.getRepository(Lock)

      await this.removeExpiredLocks({ lockRepository })

      await lockRepository.delete({
        value: hash,
      })
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async destroy(): Promise<void> {}
}
