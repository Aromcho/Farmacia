import { Module } from '@nestjs/common';
import { OrdersAdminController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController, OrdersAdminController],
  providers: [OrdersService],
})
export class OrdersModule {}
