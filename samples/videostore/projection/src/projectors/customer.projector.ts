import { Injectable }           from '@nestjs/common'
import { InjectRepository }     from '@nestjs/typeorm'
import { Repository }           from 'typeorm'

import { Event, EventHandler }  from '@typa/common'
import { CustomerCreatedEvent } from '@videostore/domain'

import { Customer }             from '../entities'

@Injectable()
export class CustomerProjector {
  @InjectRepository(Customer)
  private readonly customerRepository: Repository<Customer>

  @EventHandler(CustomerCreatedEvent)
  async onCustomerCreatedEvent(@Event event: CustomerCreatedEvent) {
    await this.customerRepository.save(
      this.customerRepository.create({
        id: event.customerId,
        fullName: event.fullName,
        phoneNumber: event.phoneNumber,
      })
    )
  }
}
