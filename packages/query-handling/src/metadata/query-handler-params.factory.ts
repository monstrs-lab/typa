import { ParamData }     from '@nestjs/common'
import { ParamsFactory } from '@nestjs/core/helpers/external-context-creator'

export class QueryHandlerParamsFactory implements ParamsFactory {
  exchangeKeyForValue(type: number, data: ParamData, args: any) {
    if (!args) {
      return null
    }

    return args[type]
  }
}
