import { INestApplication }        from '@nestjs/common'
import { Test }                    from '@nestjs/testing'
import { v4 as uuid }              from 'uuid'

import { DomainEventProcessor }    from '@typa/common'
import { CommandProcessor }        from '@typa/common'
import { CommandGateway }          from '@typa/common'
import { QueryGateway }            from '@typa/common'

import { IntegrationCommonModule } from '../src'
import { GetTestEntityByIdQuery }  from '../src'
import { SuccessCommand }          from '../src'

describe('common', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [IntegrationCommonModule],
    }).compile()

    app = module.createNestApplication()

    await app.init()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await app.close()
  })

  it(`success dispatch`, async () => {
    const commandGateway = app.get(CommandGateway)
    const queryGateway = app.get(QueryGateway)

    const id = uuid()

    const result = await commandGateway.send(new SuccessCommand(id)).toPromise()

    await app.get(CommandProcessor).processCommand()
    await app.get(DomainEventProcessor).processDomainEvent()

    expect(result.id).toBe(id)

    const projection = await queryGateway.query(new GetTestEntityByIdQuery(id))

    expect(projection).toBeDefined()
  })
})
