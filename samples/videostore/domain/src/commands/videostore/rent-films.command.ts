import { TargetAggregateIdentifier } from '@typa/common'

export class RentFilmsCommand {
  constructor(
    @TargetAggregateIdentifier public readonly customerId: string,
    public readonly films: Array<string>,
    public readonly days: number
  ) {}
}
