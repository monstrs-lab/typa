import { Injectable, OnModuleInit }        from '@nestjs/common'
import { DiscoveryService }                from '@nestjs/core'
import { ExternalContextCreator }          from '@nestjs/core/helpers/external-context-creator'
import { ParamMetadata }                   from '@nestjs/core/helpers/interfaces/params-metadata.interface'
import { InstanceWrapper }                 from '@nestjs/core/injector/instance-wrapper'
import { MetadataScanner }                 from '@nestjs/core/metadata-scanner'

import { COMMAND_HANDLER_ARGS_METADATA }   from '../decorators'
import { CommandHandlerParamsFactory }     from './command-handler-params.factory'
import { CommandHandlingMetadataAccessor } from './command-handling-metadata.accessor'
import { CommandHandlingMetadataRegistry } from './command-handling-metadata.registry'
import { CommandHandlingMember }           from './command-handling.member'

@Injectable()
export class CommandHandlingMetadataExplorer implements OnModuleInit {
  private readonly eventSourcingHandlerParamsFactory = new CommandHandlerParamsFactory()

  constructor(
    private readonly externalContextCreator: ExternalContextCreator,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly metadataAccessor: CommandHandlingMetadataAccessor,
    private readonly metadataRegistry: CommandHandlingMetadataRegistry
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
        (key: string) => this.lookupCommandHandlers(instance, key)
      )
    })
  }

  lookupCommandHandlers(instance: Record<string, Function>, key: string) {
    const metadata = this.metadataAccessor.getCommandHandlerMetadata(instance[key])

    if (metadata) {
      const handler = this.createCallbackHandler(instance, key)

      this.metadataRegistry.addCommandHandler(
        instance.constructor.name,
        metadata.command.name,
        new CommandHandlingMember(metadata.command, handler)
      )
    }
  }

  createCallbackHandler(instance, key) {
    // eslint-disable-next-line func-names
    const callback = function (...args) {
      const state = args.pop()

      const context = Object.assign(Object.create(Object.getPrototypeOf(instance)), this, state)

      return Object.getPrototypeOf(instance)[key].call(context, ...args)
    }

    const paramsFactory = this.eventSourcingHandlerParamsFactory
    const contextOptions = undefined

    return this.externalContextCreator.create<Record<number, ParamMetadata>, 'domainEvents'>(
      instance,
      callback,
      key,
      COMMAND_HANDLER_ARGS_METADATA,
      paramsFactory,
      undefined,
      undefined,
      contextOptions,
      'domainEvents'
    )
  }
}
