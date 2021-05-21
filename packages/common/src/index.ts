export * from './module'
export * from './config'

export { TypaProjectionModule } from '@typa/storage'
export { StorageType } from '@typa/storage'
export { InjectRepository } from '@typa/storage'

export { Aggregate } from '@typa/domain'
export { DomainEvent } from '@typa/domain'
export { AggregateEventHandler } from '@typa/domain'

export { Command } from '@typa/command-handling'
export { ApplyEvent } from '@typa/command-handling'
export { CommandHandler } from '@typa/command-handling'
export { TargetAggregateIdentifier } from '@typa/command-handling'
export { CommandGateway } from '@typa/command-handling'
export { CommandRejected } from '@typa/command-handling'
export { CommandFailed } from '@typa/command-handling'

export { Event } from '@typa/event-handling'
export { EventHandler } from '@typa/event-handling'

export { Query } from '@typa/query-handling'
export { QueryHandler } from '@typa/query-handling'
export { QueryGateway } from '@typa/query-handling'
