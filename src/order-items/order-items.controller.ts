import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import { OrdersService } from './order-items.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderWithItemsDto } from './dto/create-order-with-items.dto'; // ✅ FIXED
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Order Items')
@Controller('order-items')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /* ============================
     CREATE ORDER (USER)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new order with items' })
  @ApiBody({ type: CreateOrderWithItemsDto }) // ✅ FIXED
  createOrder(@Req() req: any, @Body() dto: CreateOrderWithItemsDto) { // ✅ FIXED
    console.log('Received order creation request:', { userId: req.user, dto });
    return this.ordersService.createOrder(req.user.userId, dto);
  }

  /* ============================
     GET ORDER WITH ITEMS
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get order details with items' })
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  /* ============================
     ACCEPT ORDER (VENDOR)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  @ApiOperation({ summary: 'Vendor accepts an order' })
  acceptOrder(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.acceptOrder(id, req.user.userId);
  }

  /* ============================
     MARK AS DELIVERED (VENDOR)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post(':id/deliver')
  @ApiOperation({ summary: 'Vendor marks order as delivered' })
  markAsDelivered(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.markAsDelivered(id, req.user.userId);
  }

  /* ============================
     COMPLETE ORDER (USER)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  @ApiOperation({ summary: 'User marks order as complete' })
  completeOrder(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.completeOrder(id, req.user.userId);
  }

  /* ============================
     REJECT ORDER (VENDOR)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  @ApiOperation({ summary: 'Vendor rejects an order' })
  rejectOrder(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.rejectOrder(id, req.user.userId);
  }
}