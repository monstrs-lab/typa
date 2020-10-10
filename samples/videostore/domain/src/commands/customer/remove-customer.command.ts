import { TargetAggregateIdentifier } from '@typa/common'

export class RemoveCustomerCommand {
  constructor(@TargetAggregateIdentifier public readonly customerId: string) {}
}
