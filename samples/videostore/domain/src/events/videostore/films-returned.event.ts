export class FilmsReturnedEvent {
  constructor(public readonly customerId: string, public readonly films: Array<string>) {}
}
