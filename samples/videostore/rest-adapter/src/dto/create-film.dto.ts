import { Type }               from 'class-transformer'
import { IsEnum, IsString }   from 'class-validator'
import { IsDate, IsInt, Min } from 'class-validator'
import { v4 as uuid }         from 'uuid'

import { FilmFormat }         from '@videostore/domain'
import { FilmType }           from '@videostore/domain'

export class CreateFilmDto {
  readonly filmId: string = uuid()

  @IsString()
  readonly title: string

  @IsEnum(FilmFormat)
  readonly format: FilmFormat

  @IsEnum(FilmType)
  readonly type: FilmType

  @IsString()
  readonly genre: string

  @IsString({ each: true })
  readonly languages: string[]

  @IsInt()
  @Min(0)
  readonly minimumAge: number

  @IsDate()
  @Type(() => Date)
  readonly releaseDate: Date

  @IsString()
  readonly description: string
}
