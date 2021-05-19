import { Aggregate }             from '@typa/common'
import { CommandHandler }        from '@typa/common'
import { Command }               from '@typa/common'
import { ApplyEvent }            from '@typa/common'
import { AggregateEventHandler } from '@typa/common'
import { DomainEvent }           from '@typa/common'

import { CreateCustomerCommand } from '../commands'
import { RemoveCustomerCommand } from '../commands'
import { ReturnFilmsCommand }    from '../commands'
import { RentFilmsCommand }      from '../commands'
import { CustomerCreatedEvent }  from '../events'
import { CustomerRemovedEvent }  from '../events'
import { FilmsRentedEvent }      from '../events'
import { FilmsReturnedEvent }    from '../events'

@Aggregate()
export class Customer {
  private customerId: string

  private fullName: string

  private phoneNumber: string

  @CommandHandler(CreateCustomerCommand)
  create(@Command command: CreateCustomerCommand, @ApplyEvent apply) {
    apply(new CustomerCreatedEvent(command.customerId, command.fullName, command.phoneNumber))
  }

  @AggregateEventHandler(CustomerCreatedEvent)
  onCreated(@DomainEvent event: CustomerCreatedEvent) {
    this.customerId = event.customerId
    this.fullName = event.fullName
    this.phoneNumber = event.phoneNumber
  }

  @CommandHandler(RemoveCustomerCommand)
  remove(@Command command: RemoveCustomerCommand, @ApplyEvent apply) {
    apply(new CustomerRemovedEvent(command.customerId))
  }

  @CommandHandler(RentFilmsCommand)
  rent(@Command command: RentFilmsCommand, @ApplyEvent apply) {
    apply(new FilmsRentedEvent(command.customerId, command.films, command.days))
  }

  @CommandHandler(ReturnFilmsCommand)
  return(@Command command: ReturnFilmsCommand, @ApplyEvent apply) {
    apply(new FilmsReturnedEvent(command.customerId, command.films))
  }
}
