/* eslint-disable global-require */

import { Column, Entity, PrimaryColumn }      from 'typeorm'
import { CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { ManyToOne }                          from 'typeorm'

import { FilmFormat }                         from '@videostore/domain'
import { FilmType }                           from '@videostore/domain'

@Entity()
export class Film {
  @PrimaryColumn()
  id: string

  @Column()
  title: string

  @Column('enum', {
    enum: FilmFormat,
  })
  format: FilmFormat

  @Column('enum', {
    enum: FilmType,
  })
  type: FilmType

  @Column()
  genre: string

  @Column('simple-array')
  languages: Array<string>

  @Column()
  minimumAge: number

  @Column()
  releaseDate: Date

  @Column()
  description: string

  @ManyToOne(
    (type) => require('./customer.entity').Customer,
    (customer: any) => customer.rentedFilms,
    { nullable: true }
  )
  renter: any

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
