import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderParamDto } from './dto/order-param.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /* ============================
     CREATE ORDER (USER)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post()
  createOrder(
    @Req() req: any,
    @Body() body: CreateOrderDto, // ✅ DTO used
  ) {
    return this.ordersService.createOrder(
      req.user.userId,
      body.vendorId,
      body.amount,
    );
  }

  /* ============================
     ACCEPT ORDER (VENDOR)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  acceptOrder(@Param() params: OrderParamDto, @Req() req: any) {
    return this.ordersService.acceptOrder(params.id, req.user.userId);
  }

  /* ============================
     MARK AS DELIVERED (VENDOR)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post(':id/deliver')
  markAsDelivered(@Param() params: OrderParamDto, @Req() req: any) {
    return this.ordersService.markAsDelivered(
      params.id,
      req.user.userId,
    );
  }

  /* ============================
     COMPLETE ORDER (USER)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  completeOrder(@Param() params: OrderParamDto, @Req() req: any) {
    return this.ordersService.completeOrder(
      params.id,
      req.user.userId,
    );
  }

  /* ============================
     REJECT ORDER (VENDOR)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  rejectOrder(@Param() params: OrderParamDto, @Req() req: any) {
    return this.ordersService.rejectOrder(
      params.id,
      req.user.userId,
    );
  }
}