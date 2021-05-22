import { Repository }           from 'typeorm'

import { InjectRepository }     from '@typa/common'
import { Query, QueryHandler }  from '@typa/common'
import { GetCustomerByIdQuery } from '@videostore/domain'

import { Customer }             from '../entities'

export class CustomerQueryHandler {
  @InjectRepository(Customer)
  private readonly customerRepository: Repository<Customer>

  @QueryHandler(GetCustomerByIdQuery)
  getCustomerById(@Query query: GetCustomerByIdQuery) {
    return this.customerRepository.findOne(query.id)
  }
}
