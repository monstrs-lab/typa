export class FilmsRentedEvent {
  constructor(
    public readonly customerId: string,
    public readonly films: Array<string>,
    public readonly days: number
  ) {}
}
