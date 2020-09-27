import { Test }             from '@nestjs/testing'

import { TypeOrmLogger }    from './logger'
import { NestLogger }       from './logger'
import { TypaLoggerModule } from './logger.module'

describe('logger', () => {
  describe('module', () => {
    it(`register`, async () => {
      const module = await Test.createTestingModule({
        imports: [TypaLoggerModule.register()],
      }).compile()

      expect(module.get(TypeOrmLogger)).toBeDefined()
      expect(module.get(NestLogger)).toBeDefined()
    })
  })
})
