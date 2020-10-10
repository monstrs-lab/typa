import { IsString }   from 'class-validator'
import { v4 as uuid } from 'uuid'

export class CreateCustomerDto {
  readonly customerId: string = uuid()

  @IsString()
  readonly fullName: string

  @IsString()
  readonly phoneNumber: string
}
