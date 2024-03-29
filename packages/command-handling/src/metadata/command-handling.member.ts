import { AssertionError }      from 'assert'
import { Command }             from 'wolkenkit/build/lib/common/elements/Command'
import { CommandData }         from 'wolkenkit/build/lib/common/elements/CommandData'
import { State }               from 'wolkenkit/build/lib/common/elements/State'

import { IEvent }              from '@typa/event-handling'
import { Repository }          from '@typa/domain'

import { ICommandConstructor } from '../interfaces'
import { ICommand }            from '../interfaces'

type ApplyEvent = (event: IEvent) => void

export type CommandContextHandlingMember = <TState extends State>(
  ...args: Array<TState | ICommand | ApplyEvent>
) => Promise<void | Error | AssertionError>

export class CommandHandlingMember {
  constructor(
    private command: ICommandConstructor,
    private handler: CommandContextHandlingMember,
    private aggregateName,
    private targetAggregateIdentifier: string = 'id'
  ) {}

  getCommandName() {
    return (this.command as any).name
  }

  getAggregateName() {
    return this.aggregateName
  }

  getTargetAggregateIdentifier() {
    return this.targetAggregateIdentifier
  }

  async handle<TState extends State, TCommandData extends CommandData>(
    state: TState,
    command: Command<TCommandData>,
    repository: Repository
  ): Promise<Array<IEvent>> {
    const { command: Cmd, handler } = this

    const events: Array<IEvent> = []

    const cmd = Object.assign(new Cmd(), command.data)

    const result = await handler<TState>(
      state,
      cmd,
      (event: IEvent) => {
        events.push(event)
      },
      {},
      repository
    )

    if (result && result instanceof Error) {
      throw result
    }

    return events
  }
}
