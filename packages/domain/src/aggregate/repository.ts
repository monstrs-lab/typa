import { Injectable }             from '@nestjs/common'

import { DomainEventStore }       from '@typa/storage'

import { DomainMetadataRegistry } from '../metadata'
import { AggregateInstance }      from './aggregate.instance'
import { AggregateIdentifier }    from './wolkenkit'
import { ContextIdentifier }      from './wolkenkit'
import { State }                  from './wolkenkit'
import { getSnapshotStrategy }    from './wolkenkit'

@Injectable()
export class Repository {
  constructor(
    private readonly domainEventStore: DomainEventStore,
    private readonly metadataRegistry: DomainMetadataRegistry
  ) {}

  public async getAggregateInstance<TState extends State>(
    contextIdentifier: ContextIdentifier,
    aggregateIdentifier: AggregateIdentifier
  ): Promise<AggregateInstance<TState>> {
    return AggregateInstance.create(
      contextIdentifier,
      aggregateIdentifier,
      this.domainEventStore,
      this.metadataRegistry,
      getSnapshotStrategy({ name: 'revision', configuration: { revisionLimit: 100 } })
    )
  }
}
