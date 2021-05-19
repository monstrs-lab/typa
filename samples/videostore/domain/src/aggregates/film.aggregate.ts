import { Aggregate }             from '@typa/common'
import { CommandHandler }        from '@typa/common'
import { Command }               from '@typa/common'
import { ApplyEvent }            from '@typa/common'
import { AggregateEventHandler } from '@typa/common'
import { DomainEvent }           from '@typa/common'

import { CreateFilmCommand }     from '../commands'
import { RemoveFilmCommand }     from '../commands'
import { FilmFormat }            from '../constants'
import { FilmType }              from '../constants'
import { FilmCreatedEvent }      from '../events'
import { FilmRemovedEvent }      from '../events'
import { Customer }              from './customer.aggregate'

@Aggregate()
export class Film {
  private filmId: string

  private title: string

  private type: FilmType

  private format: FilmFormat

  private genre: string

  private languages: Array<string>

  private minimumAge: number

  private releaseDate: Date

  private description: string

  private renter: Customer

  @CommandHandler(CreateFilmCommand)
  create(@Command command: CreateFilmCommand, @ApplyEvent apply) {
    apply(
      new FilmCreatedEvent(
        command.filmId,
        command.title,
        command.type,
        command.format,
        command.genre,
        command.languages,
        command.minimumAge,
        command.releaseDate,
        command.description
      )
    )
  }

  @AggregateEventHandler(FilmCreatedEvent)
  onCreated(@DomainEvent event: FilmCreatedEvent) {
    this.filmId = event.filmId
    this.title = event.title
    this.type = event.type
    this.format = event.format
    this.genre = event.genre
    this.languages = event.languages
    this.minimumAge = event.minimumAge
    this.releaseDate = event.releaseDate
    this.description = event.description
  }

  @CommandHandler(RemoveFilmCommand)
  remove(@Command command: RemoveFilmCommand, @ApplyEvent apply) {
    apply(new FilmRemovedEvent(command.filmId))
  }
}
