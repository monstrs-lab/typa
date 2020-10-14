import { StorageType }        from '@typa/storage'

import { TypaOptionsFactory } from '../module'
import { TypaModuleOptions }  from '../module'

export class TypaEnvConfig implements TypaOptionsFactory {
  createTypaOptions(): TypaModuleOptions {
    const service = process.env.SERVICE_CONTEXT_NAME

    return {
      storage: this.createStorageOptions(service),
    }
  }

  protected createStorageOptions(entityPrefix?: string) {
    const port = parseInt(process.env.STORAGE_PORT || '5432', 10)

    return {
      type: (process.env.STORAGE_TYPE as StorageType.postgres) || StorageType.postgres,
      host: process.env.STORAGE_HOST || 'localhost',
      database: process.env.STORAGE_DATABASE || 'db',
      username: process.env.STORAGE_USERNAME || 'postgres',
      password: process.env.STORAGE_PASSWORD || 'password',
      port: Number.isNaN(port) ? 5432 : port,
      entityPrefix,
    }
  }
}
