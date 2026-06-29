export abstract class DomainEvent<T = any> {
  abstract readonly name: string;
  readonly eventId: string;
  readonly payload: T;
  readonly occurredAt?: Date;

  constructor(payload: T) {
    this.eventId = crypto.randomUUID();
    this.payload = payload;
    this.occurredAt = new Date();
  }
}
