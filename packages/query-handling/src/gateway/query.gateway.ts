import { Injectable }   from '@nestjs/common'
import { Observable }   from 'rxjs'

import { IQueryResult } from '../interfaces'
import { IQueryBus }    from '../interfaces'
import { IQuery }       from '../interfaces'

@Injectable()
export class QueryGateway<QueryBase extends IQuery = IQuery> {
  constructor(private commandBus: IQueryBus) {}

  query<T extends QueryBase>(command: T): Observable<IQueryResult> {
    return this.commandBus.dispatch(command)
  }
}
