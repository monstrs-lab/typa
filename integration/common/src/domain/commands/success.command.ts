import { TargetAggregateIdentifier } from '@typa/common'

export class SuccessCommand {
  constructor(@TargetAggregateIdentifier public readonly aggregateId: string) {}
}
