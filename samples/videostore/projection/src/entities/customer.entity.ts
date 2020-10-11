import { Column, Entity, PrimaryColumn }      from 'typeorm'
import { CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { OneToMany }                          from 'typeorm'

import { Film }                               from './film.entity'

@Entity()
export class Customer {
  @PrimaryColumn()
  id: string

  @Column()
  fullName: string

  @Column()
  phoneNumber: string

  @Column({ default: 0 })
  bonusPoints: number

  @OneToMany((type) => Film, (film) => film.renter)
  rentedFilms: Film[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
