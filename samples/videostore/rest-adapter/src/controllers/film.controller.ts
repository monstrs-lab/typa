import { Body, Controller }         from '@nestjs/common'
import { Get, Param, Post }         from '@nestjs/common'
import { UsePipes, ValidationPipe } from '@nestjs/common'

import { CommandGateway }           from '@typa/common'
import { QueryGateway }             from '@typa/common'
import { CreateFilmCommand }        from '@videostore/domain'
import { GetFilmByIdQuery }         from '@videostore/domain'
import { GetFilmsQuery }            from '@videostore/domain'

import { CreateFilmDto }            from '../dto'

@Controller('films')
export class FilmsController {
  constructor(
    private readonly commandGateway: CommandGateway,
    private readonly queryGateway: QueryGateway
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() request: CreateFilmDto) {
    return this.commandGateway.send(
      new CreateFilmCommand(
        request.filmId,
        request.title,
        request.type,
        request.format,
        request.genre,
        request.languages,
        request.minimumAge,
        request.releaseDate,
        request.description
      )
    )
  }

  @Get()
  findAll() {
    return this.queryGateway.query(new GetFilmsQuery())
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queryGateway.query(new GetFilmByIdQuery(id))
  }
}
