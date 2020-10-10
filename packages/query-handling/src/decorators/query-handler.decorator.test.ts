/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { QUERY_HANDLER_METADATA } from './query-handler.decorator'
import { QueryHandler }           from './query-handler.decorator'

describe('query-handling', () => {
  describe('decorators', () => {
    describe('query-handler', () => {
      class TestQuery {}

      class Test {
        @QueryHandler(TestQuery)
        public static test() {}
      }

      it('should enhance query handler with metadata', () => {
        const metadata = Reflect.getMetadata(QUERY_HANDLER_METADATA, Test.test)

        expect(metadata).toEqual({ query: TestQuery })
      })
    })
  })
})
