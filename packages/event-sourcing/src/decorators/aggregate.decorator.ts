import { SetMetadata }     from '@nestjs/common'
import { applyDecorators } from '@nestjs/common'

export interface AggregateMetadata {
  initialState?: object
}

export const AGGREGATE_METADATA = '__aggregateMetadata__'

export const Aggregate = (): ClassDecorator => applyDecorators(SetMetadata(AGGREGATE_METADATA, {}))
