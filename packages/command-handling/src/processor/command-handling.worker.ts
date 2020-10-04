import pForever                     from 'p-forever'
import { Injectable }               from '@nestjs/common'
import { OnApplicationBootstrap }   from '@nestjs/common'
import { OnApplicationShutdown }    from '@nestjs/common'

import { CommandHandlingProcessor } from './command-handling.processor'

@Injectable()
export class CommandHanlingWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private started = false

  private readonly concurrentCommands = 100

  constructor(private readonly commandProcessor: CommandHandlingProcessor) {}

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
    for (let i = 0; i < this.concurrentCommands; i++) {
      pForever(
        // eslint-disable-next-line consistent-return
        async (): Promise<void | Symbol> => {
          if (!this.started) {
            return pForever.end
          }

          await this.commandProcessor.processCommand()
        }
      )
    }
  }
}
