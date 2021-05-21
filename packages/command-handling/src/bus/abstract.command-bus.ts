import { Injectable }                                     from '@nestjs/common'
import { Observable, of }                                 from 'rxjs'
import { Command }                                        from 'wolkenkit/build/lib/common/elements/Command'
import { CommandWithMetadata }                            from 'wolkenkit/build/lib/common/elements/CommandWithMetadata'
import { from as fromPromise }                            from 'rxjs'
import { throwError }                                     from 'rxjs'
import { v4 as uuid }                                     from 'uuid'

import { CommandEmptyTargetAggregateIdentifierException } from '../exceptions'
import { CommandHandlerNotFoundException }                from '../exceptions'
import { ICommandBus }                                    from '../interfaces'
import { ICommand }                                       from '../interfaces'
import { CommandHandlingMetadataRegistry }                from '../metadata'
import { CommandHandlingMember }                          from '../metadata'
import { ClientMetadata }                                 from './client.metadata'

const isFunction = (fn: any): boolean => typeof fn === 'function'

export interface HandleResult {
  id: string
}

@Injectable()
export abstract class AbstractCommandBus<CommandBase extends ICommand = ICommand>
  implements ICommandBus<CommandBase>
{
  constructor(private readonly metadataRegistry: CommandHandlingMetadataRegistry) {}

  dispatch<T extends CommandBase>(command: T): Observable<any> {
    const commandName = this.getCommandName(command as any as Function)

    const handler = this.metadataRegistry.getCommandHandler(commandName)

    if (!handler) {
      return throwError(new CommandHandlerNotFoundException(commandName))
    }

    const aggregateId = command[handler.getTargetAggregateIdentifier()] || (command as any).id

    if (!aggregateId) {
      return throwError(new CommandEmptyTargetAggregateIdentifierException(commandName))
    }

    const commandWithouthMetadata = new Command({
      contextIdentifier: {
        name: 'default',
      },
      aggregateIdentifier: {
        name: handler.getAggregateName(),
        id: aggregateId,
      },
      name: handler.getCommandName(),
      data: command,
    })

    const commandId = uuid()

    const commandWithMetadata = new CommandWithMetadata({
      ...commandWithouthMetadata,
      id: commandId,
      metadata: {
        causationId: commandId,
        correlationId: commandId,
        timestamp: Date.now(),
        client: new ClientMetadata(),
        initiator: { user: new ClientMetadata().user },
      },
    })

    try {
      return this.transformToObservable(this.handle(commandWithMetadata))
    } catch (error) {
      return throwError(error)
    }
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

  private getCommandName(command: Function): string {
    const { constructor } = Object.getPrototypeOf(command)

    return constructor.name as string
  }

  protected getCommandHandler(name: string): CommandHandlingMember {
    const commandHandler = this.metadataRegistry.getCommandHandler(name)

    if (!commandHandler) {
      throw new CommandHandlerNotFoundException(name)
    }

    return commandHandler
  }

  protected abstract handle(command: CommandWithMetadata<any>): Promise<HandleResult>
}
