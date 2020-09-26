import { Test }          from '@nestjs/testing'

import { TypeOrmLogger } from './logger'
import { NestLogger }    from './logger'
import { LoggerModule }  from './logger.module'

describe('logger', () => {
  describe('module', () => {
    it(`register`, async () => {
      const module = await Test.createTestingModule({
        imports: [LoggerModule.register()],
      }).compile()

      expect(module.get(TypeOrmLogger)).toBeDefined()
      expect(module.get(NestLogger)).toBeDefined()
    })
  })
})
