import { Injectable, OnModuleInit }          from '@nestjs/common'
import { DiscoveryService }                  from '@nestjs/core'
import { ExternalContextCreator }            from '@nestjs/core/helpers/external-context-creator'
import { ParamMetadata }                     from '@nestjs/core/helpers/interfaces/params-metadata.interface'
import { InstanceWrapper }                   from '@nestjs/core/injector/instance-wrapper'
import { MetadataScanner }                   from '@nestjs/core/metadata-scanner'

import { DOMAIN_EVENT_ARGS_METADATA }        from '../decorators'
import { EventSourcingHandlerParamsFactory } from './event-sourcing-handler-params.factory'
import { EventSourcingHandlingMember }       from './event-sourcing-handling.member'
import { EventSourcingMetadataAccessor }     from './event-sourcing-metadata.accessor'
import { EventSourcingMetadataRegistry }     from './event-sourcing-metadata.registry'

@Injectable()
export class EventSourcingMetadataExplorer implements OnModuleInit {
  private readonly eventSourcingHandlerParamsFactory = new EventSourcingHandlerParamsFactory()

  constructor(
    private readonly externalContextCreator: ExternalContextCreator,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly metadataAccessor: EventSourcingMetadataAccessor,
    private readonly metadataRegistry: EventSourcingMetadataRegistry
  ) {}

  onModuleInit() {
    this.explore()
  }

  explore() {
    const providers: InstanceWrapper[] = this.discoveryService.getProviders()

    providers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper

      if (!instance || !Object.getPrototypeOf(instance)) {
        return
      }

      this.lookupAggregates(instance)

      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (key: string) => this.lookupEventSourcingHandlers(instance, key)
      )
    })
  }

  lookupAggregates(instance) {
    const metadata = this.metadataAccessor.getAggregateMetadata(instance)

    if (metadata) {
      this.metadataRegistry.addAggregate(instance.constructor.name, metadata)
    }
  }

  lookupEventSourcingHandlers(instance: Record<string, Function>, key: string) {
    const metadata = this.metadataAccessor.getEventSourcingHandlerMetadata(instance[key])

    if (metadata) {
      const handler = this.createCallbackHandler(instance, key)

      this.metadataRegistry.addEventSourcingHandler(
        instance.constructor.name,
        metadata.event.name,
        new EventSourcingHandlingMember(metadata.event, handler)
      )
    }
  }

  createCallbackHandler(instance, key) {
    // eslint-disable-next-line func-names
    const callback = function (...args) {
      const state = args.pop()

      const context = Object.assign(Object.create(Object.getPrototypeOf(instance)), this, state)
      const prevContext = Object.assign(Object.create(context), context)

      Object.getPrototypeOf(instance)[key].call(context, ...args)

      return Object.keys(context)
        .filter((changedKey) => context[changedKey] !== prevContext[changedKey])
        .reduce(
          (result, changedKey) => ({
            ...result,
            [changedKey]: context[changedKey],
          }),
          {}
        )
    }

    const paramsFactory = this.eventSourcingHandlerParamsFactory
    const contextOptions = undefined

    return this.externalContextCreator.create<Record<number, ParamMetadata>, 'domainEvents'>(
      instance,
      callback,
      key,
      DOMAIN_EVENT_ARGS_METADATA,
      paramsFactory,
      undefined,
      undefined,
      contextOptions,
      'domainEvents'
    )
  }
}