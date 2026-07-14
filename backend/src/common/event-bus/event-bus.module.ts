import { Module } from '@nestjs/common';
import { EVENT_BUS } from 'src/common/event-bus/event-bus.tokens';
import { EventEmitterBus } from 'src/common/event-bus/implementations/event-emitter.bus';

@Module({
  providers: [
    {
      provide: EVENT_BUS,
      useClass: EventEmitterBus,
    },
  ],
  exports: [EVENT_BUS],
})
export class EventBusModule {}
