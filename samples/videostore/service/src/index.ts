import { NestFactory }      from '@nestjs/core'

import { VideostoreModule } from './videostore.module'

declare const module: any

const bootstrap = async () => {
  const app = await NestFactory.create(VideostoreModule)

  app.enableShutdownHooks()

  await app.listen(3000)

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}

bootstrap()
