import { Column, Entity, PrimaryColumn }      from 'typeorm'
import { CreateDateColumn, UpdateDateColumn } from 'typeorm'

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

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
