import { Module }              from '@nestjs/common'

import { CustomersController } from './controllers'

@Module({
  controllers: [CustomersController],
})
export class VideoStoreRestAdapterModule {}
