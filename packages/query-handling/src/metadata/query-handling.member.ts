import { Observable }   from 'rxjs'

import { IQueryResult } from '../interfaces'
import { IQuery }       from '../interfaces'

export type QueryContextHandlingMember = (...args: Array<IQuery>) => Promise<void> | void

export class QueryHandlingMember {
  constructor(private handler: QueryContextHandlingMember) {}

  handle(query: IQuery): Observable<IQueryResult> | Promise<IQueryResult> | IQueryResult {
    const { handler } = this

    return handler(query)
  }
}
