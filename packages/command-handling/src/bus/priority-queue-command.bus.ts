import { Injectable }                      from '@nestjs/common'
import { Observable, of }                  from 'rxjs'
import { Command }                         from 'wolkenkit/build/lib/common/elements/Command'
import { CommandWithMetadata }             from 'wolkenkit/build/lib/common/elements/CommandWithMetadata'
import { from as fromPromise }             from 'rxjs'
import { throwError }                      from 'rxjs'
import { v4 as uuid }                      from 'uuid'

import { CommandPriorityQueueStore }       from '@typa/storage'

import { CommandHandlerNotFoundException } from '../exceptions'
import { ICommandBus }                     from '../interfaces'
import { ICommand }                        from '../interfaces'
import { CommandHandlingMetadataRegistry } from '../metadata'
import { ClientMetadata }                  from './client.metadata'

const isFunction = (fn: any): boolean => typeof fn === 'function'

@Injectable()
export class PriorityQueueCommandBus<CommandBase extends ICommand = ICommand>
  implements ICommandBus<CommandBase> {
  constructor(
    private priorityQueue: CommandPriorityQueueStore,
    private readonly metadataRegistry: CommandHandlingMetadataRegistry
  ) {}

  dispatch<T extends CommandBase>(command: T): Observable<any> {
    const commandName = this.getCommandName((command as any) as Function)

    const handler = this.metadataRegistry.getCommandHandler(commandName)

    if (!handler) {
      return throwError(new CommandHandlerNotFoundException(commandName))
    }

    const aggregateId = command[handler.getTargetAggregateIdentifier()] || (command as any).id

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

    return this.transformToObservable(this.handle(commandWithMetadata))
  }

  protected async handle(command) {
    try {
      await this.priorityQueue.enqueue({
        item: command,
        discriminator: command.aggregateIdentifier.id,
        priority: command.metadata.timestamp,
      })
    } catch (error) {
      return throwError(error)
    }

    return { id: command.aggregateIdentifier.id }
  }

  protected isObservable(input: unknown): input is Observable<any> {
    return input && isFunction((input as Observable<any>).subscribe)
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
}
