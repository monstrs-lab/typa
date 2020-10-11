import { Injectable }          from '@nestjs/common'
import { InjectRepository }    from '@nestjs/typeorm'
import { Repository }          from 'typeorm'

import { Event, EventHandler } from '@typa/common'
import { FilmCreatedEvent }    from '@videostore/domain'

import { Film }                from '../entities'

@Injectable()
export class FilmProjector {
  @InjectRepository(Film)
  private readonly filmRepository: Repository<Film>

  @EventHandler(FilmCreatedEvent)
  async onFilmCreatedEvent(@Event event: FilmCreatedEvent) {
    await this.filmRepository.save(
      this.filmRepository.create({
        id: event.filmId,
        title: event.title,
        type: event.type,
        format: event.format,
        genre: event.genre,
        languages: event.languages,
        minimumAge: event.minimumAge,
        releaseDate: event.releaseDate,
        description: event.description,
      })
    )
  }
}
