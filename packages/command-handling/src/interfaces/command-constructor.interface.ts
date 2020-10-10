import { ICommand } from './command.interface'

export interface ICommandConstructor {
  new (...args: Array<any>): ICommand
}
