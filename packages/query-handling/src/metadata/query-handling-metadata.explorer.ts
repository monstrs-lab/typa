import { Injectable, OnModuleInit }      from '@nestjs/common'
import { DiscoveryService }              from '@nestjs/core'
import { ExternalContextCreator }        from '@nestjs/core/helpers/external-context-creator'
import { ParamMetadata }                 from '@nestjs/core/helpers/interfaces/params-metadata.interface'
import { InstanceWrapper }               from '@nestjs/core/injector/instance-wrapper'
import { MetadataScanner }               from '@nestjs/core/metadata-scanner'

import { QUERY_HANDLER_ARGS_METADATA }   from '../decorators'
import { QueryHandlerParamsFactory }     from './query-handler-params.factory'
import { QueryHandlingMetadataAccessor } from './query-handling-metadata.accessor'
import { QueryHandlingMetadataRegistry } from './query-handling-metadata.registry'
import { QueryHandlingMember }           from './query-handling.member'

@Injectable()
export class QueryHandlingMetadataExplorer implements OnModuleInit {
  private readonly queryHandlerParamsFactory = new QueryHandlerParamsFactory()

  constructor(
    private readonly externalContextCreator: ExternalContextCreator,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly metadataAccessor: QueryHandlingMetadataAccessor,
    private readonly metadataRegistry: QueryHandlingMetadataRegistry
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
        (key: string) => this.lookupQueryHandlers(instance, key)
      )
    })
  }

  lookupQueryHandlers(instance: Record<string, Function>, key: string) {
    const metadata = this.metadataAccessor.getQueryHandlerMetadata(instance[key])

    if (metadata) {
      const handler = this.createCallbackHandler(instance, key)

      this.metadataRegistry.addQueryHandler(metadata.query.name, new QueryHandlingMember(handler))
    }
  }

  createCallbackHandler(instance, key) {
    const paramsFactory = this.queryHandlerParamsFactory
    const contextOptions = undefined

    return this.externalContextCreator.create<Record<number, ParamMetadata>, 'queryHandler'>(
      instance,
      instance[key],
      key,
      QUERY_HANDLER_ARGS_METADATA,
      paramsFactory,
      undefined,
      undefined,
      contextOptions,
      'queryHandler'
    )
  }
}
