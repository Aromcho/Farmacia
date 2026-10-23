import { Global, Module } from '@nestjs/common';
import { StoreAdminController, StoreController } from './store.controller';
import { StoreService } from './store.service';

@Global()
@Module({
  controllers: [StoreController, StoreAdminController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
