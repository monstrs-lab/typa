export * from './module'

export { Logger } from '@typa/logger'
export { NestLogger } from '@typa/logger'
export { TypeOrmLogger } from '@typa/logger'

export { Aggregate } from '@typa/event-sourcing'
export { DomainEvent } from '@typa/event-sourcing'
export { EventSourcingHandler } from '@typa/event-sourcing'

export { Command } from '@typa/command-handling'
export { ApplyEvent } from '@typa/command-handling'
export { CommandHandler } from '@typa/command-handling'
export { TargetAggregateIdentifier } from '@typa/command-handling'
export { CommandGateway } from '@typa/command-handling'

export { TypaProjectionModule } from '@typa/projection'
