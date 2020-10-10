import { TargetAggregateIdentifier } from '@typa/common'

export class RemoveFilmCommand {
  constructor(@TargetAggregateIdentifier public readonly filmId: string) {}
}
