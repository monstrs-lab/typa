import { Injectable, OnModuleInit }           from '@nestjs/common'
import { DiscoveryService }                   from '@nestjs/core'
import { ExternalContextCreator }             from '@nestjs/core/helpers/external-context-creator'
import { ParamMetadata }                      from '@nestjs/core/helpers/interfaces/params-metadata.interface'
import { InstanceWrapper }                    from '@nestjs/core/injector/instance-wrapper'
import { MetadataScanner }                    from '@nestjs/core/metadata-scanner'

import { DOMAIN_EVENT_ARGS_METADATA }         from '../decorators'
import { AggregateEventHandlerParamsFactory } from './aggregate-event-handler-params.factory'
import { AggregateEventHandlingMember }       from './aggregate-event-handling.member'
import { DomainMetadataAccessor }             from './domain-metadata.accessor'
import { DomainMetadataRegistry }             from './domain-metadata.registry'

@Injectable()
export class DomainMetadataExplorer implements OnModuleInit {
  private readonly eventSourcingHandlerParamsFactory = new AggregateEventHandlerParamsFactory()

  constructor(
    private readonly externalContextCreator: ExternalContextCreator,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly metadataAccessor: DomainMetadataAccessor,
    private readonly metadataRegistry: DomainMetadataRegistry
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
        (key: string) => this.lookupAggregateEventHandlers(instance, key)
      )
    })
  }

  lookupAggregates(instance) {
    const metadata = this.metadataAccessor.getAggregateMetadata(instance)

    if (metadata) {
      this.metadataRegistry.addAggregate(instance.constructor.name, metadata)
    }
  }

  lookupAggregateEventHandlers(instance: Record<string, Function>, key: string) {
    const metadata = this.metadataAccessor.getAggregateEventHandleMetadata(instance[key])

    if (metadata) {
      const handler = this.createCallbackHandler(instance, key)

      this.metadataRegistry.addAggregateEventHandler(
        instance.constructor.name,
        metadata.event.name,
        new AggregateEventHandlingMember(metadata.event, handler)
      )
    }
  }

  createCallbackHandler(instance, key) {
    // eslint-disable-next-line func-names
    const callback = function (...args) {
      const state = args.pop()

      const context = Object.assign(Object.create(Object.getPrototypeOf(instance)), this, state)

      Object.getPrototypeOf(instance)[key].call(context, ...args)

      return { ...context }
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
