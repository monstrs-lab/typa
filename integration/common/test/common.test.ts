import { INestApplication }        from '@nestjs/common'
import { Test }                    from '@nestjs/testing'
import { v4 as uuid }              from 'uuid'

import { CommandGateway }          from '@typa/common'
import { QueryGateway }            from '@typa/common'

import { IntegrationCommonModule } from '../src'
import { GetTestEntityByIdQuery }  from '../src'
import { SuccessCommand }          from '../src'

jest.setTimeout(10000)

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

    expect(result.id).toBe(id)

    const projection = await queryGateway.query(new GetTestEntityByIdQuery(id)).toPromise()

    expect(projection).toBeDefined()
    expect(projection.id).toBe(id)
  })
})
