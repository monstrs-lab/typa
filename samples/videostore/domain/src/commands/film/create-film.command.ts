import { TargetAggregateIdentifier } from '@typa/common'

import { FilmFormat }                from '../../constants'
import { FilmType }                  from '../../constants'

export class CreateFilmCommand {
  constructor(
    @TargetAggregateIdentifier public readonly filmId: string,
    public readonly title: string,
    public readonly type: FilmType,
    public readonly format: FilmFormat,
    public readonly genre: string,
    public readonly languages: Array<string>,
    public readonly minimumAge: number,
    public readonly releaseDate: Date,
    public readonly description: string
  ) {}
}
