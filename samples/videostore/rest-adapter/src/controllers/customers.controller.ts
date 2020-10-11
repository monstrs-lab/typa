import { Body, Controller }         from '@nestjs/common'
import { Get, Param, Post }         from '@nestjs/common'
import { UsePipes, ValidationPipe } from '@nestjs/common'

import { CommandGateway }           from '@typa/common'
import { QueryGateway }             from '@typa/common'
import { CreateCustomerCommand }    from '@videostore/domain'
import { GetCustomerByIdQuery }     from '@videostore/domain'

import { CreateCustomerDto }        from '../dto'

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly commandGateway: CommandGateway,
    private readonly queryGateway: QueryGateway
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() request: CreateCustomerDto) {
    return this.commandGateway.send(
      new CreateCustomerCommand(request.customerId, request.fullName, request.phoneNumber)
    )
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queryGateway.query(new GetCustomerByIdQuery(id))
  }
}
