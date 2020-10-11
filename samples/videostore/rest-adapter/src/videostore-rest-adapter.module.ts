import { Module }              from '@nestjs/common'

import { CustomersController } from './controllers'
import { FilmsController }     from './controllers'

@Module({
  controllers: [CustomersController, FilmsController],
})
export class VideoStoreRestAdapterModule {}
