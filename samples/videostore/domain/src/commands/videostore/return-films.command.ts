import { TargetAggregateIdentifier } from '@typa/common'

export class ReturnFilmsCommand {
  constructor(
    @TargetAggregateIdentifier public readonly customerId: string,
    public readonly films: Array<string>
  ) {}
}
