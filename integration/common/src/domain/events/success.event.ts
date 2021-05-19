export class SuccessEvent {
  constructor(public readonly aggregateId: string, public readonly content: string) {}
}
