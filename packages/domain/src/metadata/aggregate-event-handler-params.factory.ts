import { ParamData }     from '@nestjs/common'
import { ParamsFactory } from '@nestjs/core/helpers/external-context-creator'

export class AggregateEventHandlerParamsFactory implements ParamsFactory {
  exchangeKeyForValue(type: number, data: ParamData, args: unknown[]) {
    if (!args) {
      return null
    }

    return args[type]
  }
}
