import { Provider }      from '@nestjs/common'

import { NestLogger }    from './logger'
import { TypeOrmLogger } from './logger'

export const createLoggerProvider = (): Provider[] => {
  return [
    {
      provide: TypeOrmLogger,
      useClass: TypeOrmLogger,
    },
    {
      provide: NestLogger,
      useClass: NestLogger,
    },
  ]
}
