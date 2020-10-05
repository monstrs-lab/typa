import { Injectable, OnModuleInit }      from '@nestjs/common'
import { DiscoveryService }              from '@nestjs/core'
import { ExternalContextCreator }        from '@nestjs/core/helpers/external-context-creator'
import { ParamMetadata }                 from '@nestjs/core/helpers/interfaces/params-metadata.interface'
import { InstanceWrapper }               from '@nestjs/core/injector/instance-wrapper'
import { MetadataScanner }               from '@nestjs/core/metadata-scanner'

import { EVENT_HANDLER_ARGS_METADATA }   from '../decorators'
import { EventHandlerParamsFactory }     from './event-handler-params.factory'
import { EventHandlingMetadataAccessor } from './event-handling-metadata.accessor'
import { EventHandlingMetadataRegistry } from './event-handling-metadata.registry'
import { EventHandlingMember }           from './event-handling.member'

@Injectable()
export class EventHandlingMetadataExplorer implements OnModuleInit {
  private readonly eventHandlerParamsFactory = new EventHandlerParamsFactory()

  constructor(
    private readonly externalContextCreator: ExternalContextCreator,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly metadataAccessor: EventHandlingMetadataAccessor,
    private readonly metadataRegistry: EventHandlingMetadataRegistry
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

      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (key: string) => this.lookupEventHandlers(instance, key)
      )
    })
  }

  lookupEventHandlers(instance: Record<string, Function>, key: string) {
    const metadata = this.metadataAccessor.getEventHandlerMetadata(instance[key])

    if (metadata) {
      const handler = this.createCallbackHandler(instance, key)

      this.metadataRegistry.addEventHandler(new EventHandlingMember(metadata.event, handler))
    }
  }

  createCallbackHandler(instance, key) {
    const paramsFactory = this.eventHandlerParamsFactory
    const contextOptions = undefined

    return this.externalContextCreator.create<Record<number, ParamMetadata>, 'domainEvents'>(
      instance,
      instance[key],
      key,
      EVENT_HANDLER_ARGS_METADATA,
      paramsFactory,
      undefined,
      undefined,
      contextOptions,
      'domainEvents'
    )
  }
}
