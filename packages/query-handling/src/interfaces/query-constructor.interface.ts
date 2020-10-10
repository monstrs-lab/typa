import { IQuery } from './query.interface'

export interface IQueryConstructor {
  new (...args: Array<any>): IQuery
}
