/* eslint-disable max-classes-per-file */

import 'reflect-metadata'

import { Module }                        from '@nestjs/common'
import { DiscoveryModule }               from '@nestjs/core'
import { Test }                          from '@nestjs/testing'

import { QueryHandler }                  from '../decorators'
import { Query }                         from '../decorators'
import { QueryHandlingMetadataAccessor } from './query-handling-metadata.accessor'
import { QueryHandlingMetadataExplorer } from './query-handling-metadata.explorer'
import { QueryHandlingMetadataRegistry } from './query-handling-metadata.registry'

describe('query-handling', () => {
  describe('metadata', () => {
    @Module({
      imports: [DiscoveryModule],
      providers: [
        QueryHandlingMetadataAccessor,
        QueryHandlingMetadataExplorer,
        QueryHandlingMetadataRegistry,
      ],
    })
    class TestMetadataModule {}

    describe('query handler', () => {
      let module

      class TestQuery {
        constructor(public readonly id = 'test') {}
      }

      class TestTarget {
        @QueryHandler(TestQuery)
        testQuery(@Query query: TestQuery) {}
      }

      beforeEach(async () => {
        module = await Test.createTestingModule({
          imports: [TestMetadataModule],
          providers: [TestTarget],
        }).compile()

        await module.init()
      })

      afterEach(async () => {
        await module.close()
      })

      it('should store query handler metadata', async () => {
        expect(
          module.get(QueryHandlingMetadataRegistry).getQueryHandler(TestQuery.name)
        ).toBeDefined()
      })
    })
  })
})
