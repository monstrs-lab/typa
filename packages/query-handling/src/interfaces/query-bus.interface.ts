import { Observable }   from 'rxjs'

import { IQueryResult } from './query-result.interface'
import { IQuery }       from './query.interface'

export interface IQueryBus {
  dispatch<T extends IQuery = IQuery, TQueryResult extends IQueryResult = IQueryResult>(
    query: T
  ): Observable<TQueryResult>
}
