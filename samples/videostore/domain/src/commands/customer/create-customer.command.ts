import { TargetAggregateIdentifier } from '@typa/common'

export class CreateCustomerCommand {
  constructor(
    @TargetAggregateIdentifier public readonly customerId: string,
    public readonly fullName: string,
    public readonly phoneNumber: string
  ) {}
}
