import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../common/guards/admin.guard';
import { CreateInquiryDto, CreateOrderDto, OrderQueryDto, UpdateInquiryDto, UpdateOrderDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('pedidos')
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Registra un pedido y devuelve el link de WhatsApp con el detalle */
  @Post('orders')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Post('inquiries')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  inquiry(@Body() dto: CreateInquiryDto) {
    return this.orders.createInquiry(dto);
  }
}

@ApiTags('admin / pedidos')
@Controller('admin')
@UseGuards(AdminGuard)
export class OrdersAdminController {
  constructor(private readonly orders: OrdersService) {}

  @Get('orders')
  list(@Query() q: OrderQueryDto) {
    return this.orders.list(q);
  }

  @Patch('orders/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.update(id, dto);
  }

  @Delete('orders/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.remove(id);
  }

  @Get('inquiries')
  inquiries(@Query('pending') pending?: string) {
    return this.orders.inquiriesList(pending === 'true');
  }

  @Patch('inquiries/:id')
  updateInquiry(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInquiryDto) {
    return this.orders.updateInquiry(id, dto.handled);
  }

  @Delete('inquiries/:id')
  removeInquiry(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.removeInquiry(id);
  }
}
