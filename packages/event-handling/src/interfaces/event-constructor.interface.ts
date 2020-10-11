import { IEvent } from './event.interface'

export interface IEventConstructor {
  new (...args: Array<any>): IEvent
}
