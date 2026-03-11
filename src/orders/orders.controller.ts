import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /* ============================
     CREATE ORDER (ESCROW)
     User pays → escrow
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @Req() req: any,
    @Body() body: { vendorId: string; amount: number },
  ) {
    return this.ordersService.createOrder(
      req.user.userId,
      body.vendorId,
      body.amount,
    );
  }

  /* ============================
     AUTO REFUND (CRON / ADMIN)
  ============================ */
  @Post('refund-expired')
  async refundExpiredOrders() {
    return this.ordersService.refundExpiredOrders();
  }
}
