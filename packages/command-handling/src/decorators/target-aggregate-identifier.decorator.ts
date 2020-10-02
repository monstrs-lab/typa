export const TARGET_AGGREGATE_IDENTIFIER_METADATA = '__targetAggregateIdentifier__'

export const TargetAggregateIdentifier = (
  target: Function,
  propertyKey: string | symbol,
  index: number
) => {
  Reflect.defineMetadata(TARGET_AGGREGATE_IDENTIFIER_METADATA, index, target.constructor)
}
