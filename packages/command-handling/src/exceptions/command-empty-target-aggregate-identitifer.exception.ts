export class CommandEmptyTargetAggregateIdentifierException extends Error {
  constructor(commandName: string) {
    super(`Target aggregate identifier for the "${commandName}" command was not found!`)
  }
}
