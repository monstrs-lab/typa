import { InjectRepository }    from '@nestjs/typeorm'
import { Repository }          from 'typeorm'

import { Query, QueryHandler } from '@typa/common'
import { GetFilmByIdQuery }    from '@videostore/domain'
import { GetFilmsQuery }       from '@videostore/domain'

import { Film }                from '../entities'

export class FilmQueryHandler {
  @InjectRepository(Film)
  private readonly filmRepository: Repository<Film>

  @QueryHandler(GetFilmByIdQuery)
  getFilmById(@Query query: GetFilmByIdQuery) {
    return this.filmRepository.findOne(query.id)
  }

  @QueryHandler(GetFilmsQuery)
  getFilms() {
    return this.filmRepository.find()
  }
}
