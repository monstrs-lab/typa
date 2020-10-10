import { Body, Controller, Post }   from '@nestjs/common'
import { UsePipes, ValidationPipe } from '@nestjs/common'

import { CommandGateway }           from '@typa/common'
import { CreateCustomerCommand }    from '@videostore/domain'

import { CreateCustomerDto }        from '../dto'

@Controller('customers')
export class CustomersController {
  constructor(private readonly commandGateway: CommandGateway) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() request: CreateCustomerDto) {
    return this.commandGateway.send(
      new CreateCustomerCommand(request.customerId, request.fullName, request.phoneNumber)
    )
  }
}
