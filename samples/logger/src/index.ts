import { NestFactory }         from '@nestjs/core'

import { NestLogger }          from '@typa/common'

import { SamplesLoggerModule } from './samples-logger.module'

declare const module: any

const bootstrap = async () => {
  const app = await NestFactory.create(SamplesLoggerModule, {
    logger: new NestLogger(),
  })

  app.enableShutdownHooks()

  await app.listen(3000)

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}

bootstrap()
