import { Observable } from 'rxjs'

import { ICommand }   from './command.interface'

export interface ICommandBus<CommandBase extends ICommand = ICommand> {
  dispatch<T extends CommandBase>(command: T): Observable<any>
}
