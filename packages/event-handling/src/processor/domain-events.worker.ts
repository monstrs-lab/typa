import pForever                   from 'p-forever'
import { Injectable }             from '@nestjs/common'
import { OnApplicationBootstrap } from '@nestjs/common'
import { OnApplicationShutdown }  from '@nestjs/common'

import { DomainEventProcessor }   from './domain-event.processor'

@Injectable()
export class DomanEventsWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private started = false

  private readonly concurrentFlows = 1

  constructor(private readonly domainEventProcessor: DomainEventProcessor) {}

  async onApplicationBootstrap() {
    this.start()
  }

  async onApplicationShutdown() {
    this.stop()
  }

  start() {
    this.started = true
    this.startLoop()
  }

  stop() {
    this.started = false
  }

  private startLoop() {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.concurrentFlows; i++) {
      pForever(
        // eslint-disable-next-line consistent-return
        async (): Promise<void | Symbol> => {
          if (!this.started) {
            return pForever.end
          }

          await this.domainEventProcessor.processDomainEvent()
        }
      )
    }
  }
}
