export class CustomerCreatedEvent {
  constructor(
    public readonly customerId: string,
    public readonly fullName: string,
    public readonly phoneNumber: string
  ) {}
}
