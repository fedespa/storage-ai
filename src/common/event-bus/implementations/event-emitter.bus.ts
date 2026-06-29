import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../domain-event';
import { EventBus } from '../event-bus.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventEmitterBus implements EventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.emitter.emit(event.name, event);
  }
}
