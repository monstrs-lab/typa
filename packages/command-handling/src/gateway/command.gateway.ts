import { Injectable }  from '@nestjs/common'
import { Observable }  from 'rxjs'

import { ICommandBus } from '../interfaces'
import { ICommand }    from '../interfaces'

@Injectable()
export class CommandGateway<CommandBase extends ICommand = ICommand> {
  constructor(private commandBus: ICommandBus) {}

  send<T extends CommandBase>(command: T): Observable<any> {
    return this.commandBus.dispatch(command)
  }
}
