import { CommandHandler }        from '@typa/common'
import { Aggregate }             from '@typa/common'
import { AggregateEventHandler } from '@typa/common'
import { Command }               from '@typa/common'
import { ApplyEvent }            from '@typa/common'
import { DomainEvent }           from '@typa/common'

import { SuccessCommand }        from '../commands'
import { SuccessEvent }          from '../events'

@Aggregate()
export class Test {
  private aggregateId: string

  private content: string

  @CommandHandler(SuccessCommand)
  success(@Command command: SuccessCommand, @ApplyEvent apply) {
    apply(new SuccessEvent(command.aggregateId, 'test'))
  }

  @AggregateEventHandler(SuccessEvent)
  onSuccess(@DomainEvent event: SuccessEvent) {
    this.aggregateId = event.aggregateId
    this.content = event.content
  }
}
