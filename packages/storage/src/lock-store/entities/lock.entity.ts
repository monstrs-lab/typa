import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class Lock {
  @PrimaryColumn('varchar', { length: 64 })
  value: string

  @Column('bigint')
  expiresAt: number
}
