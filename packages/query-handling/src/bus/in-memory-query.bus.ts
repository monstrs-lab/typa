import { Injectable }                    from '@nestjs/common'
import { Observable, of }                from 'rxjs'
import { from as fromPromise }           from 'rxjs'
import { throwError }                    from 'rxjs'

import { QueryHandlerNotFoundException } from '../exceptions'
import { IQueryResult }                  from '../interfaces'
import { IQueryBus }                     from '../interfaces'
import { IQuery }                        from '../interfaces'
import { QueryHandlingMetadataRegistry } from '../metadata'

const isFunction = (fn: any): boolean => typeof fn === 'function'

@Injectable()
export class InMemoryQueryBus implements IQueryBus {
  constructor(private readonly metadataRegistry: QueryHandlingMetadataRegistry) {}

  dispatch<T extends IQuery, TResult extends IQueryResult>(query: T): Observable<TResult> {
    const queryName = this.getQueryName(query)

    const handler = this.metadataRegistry.getQueryHandler(queryName)

    if (!handler) {
      return throwError(new QueryHandlerNotFoundException(queryName))
    }

    return this.transformToObservable(handler.handle(query))
  }

  protected isObservable(input): Boolean {
    return isFunction(input?.subscribe)
  }

  protected transformToObservable<T = any>(resultOrDeffered: any): Observable<T> {
    if (resultOrDeffered instanceof Promise) {
      return fromPromise(resultOrDeffered)
      // eslint-disable-next-line no-else-return
    } else if (!this.isObservable(resultOrDeffered)) {
      return of(resultOrDeffered)
    }
    return resultOrDeffered
  }

  private getQueryName(query): string {
    const { constructor } = Object.getPrototypeOf(query)

    return constructor.name as string
  }
}
