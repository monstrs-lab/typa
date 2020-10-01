import { Aggregate } from './aggregate.decorator'

describe('event-sourcing', () => {
  describe('decorators', () => {
    describe('aggregate', () => {
      @Aggregate()
      class Test {}

      it('should enhance aggregate with metadata', () => {
        expect(Reflect.getMetadata('__aggregateMetadata__', Test)).toBeDefined()
      })
    })
  })
})
