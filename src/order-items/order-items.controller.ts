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

import {
  EmptyOrderActionDto,
} from './dto/create-order-with-items.dto'

import {
  ApiTags,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Order Items')
@Controller('order-items')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  /* ==========================================================================
     CREATE ORDER FROM  CART (USER)
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new order from the authenticated user cart',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {},
      description:
        'No request body is required. The authenticated user cart is used automatically.',
    },
  })
  createOrder(@Req() req: any) {
    console.log('========================================');
    console.log('🛒 CREATE ORDER REQUEST');
    console.log('========================================');

    console.log('👤 Authenticated user:', req.user);
    console.log('👤 User ID:', req.user.id);

    return this.ordersService.createOrder(
      req.user.id,
    );
  }

  /* ==========================================================================
     GET ORDER WITH ITEMS
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get order details with items',
  })
  getOrder(
    @Param('id') id: string,
  ) {
    return this.ordersService.getOrderById(id);
  }

  /* ==========================================================================
     ACCEPT ORDER (VENDOR)
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  @ApiOperation({
    summary: 'Vendor accepts an order',
  })
  @ApiBody({
    type: EmptyOrderActionDto,
    description:
      'Target identified by URL parameter id. Pass an empty object {}',
  })
  acceptOrder(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: EmptyOrderActionDto,
  ) {
    console.log('========================================');
    console.log('✅ ACCEPT ORDER');
    console.log('========================================');

    console.log('Order ID:', id);
    console.log('User:', req.user);
    console.log('User ID:', req.user.id);

    return this.ordersService.acceptOrder(
      id,
      req.user.id,
    );
  }

  /* ==========================================================================
     MARK AS DELIVERED (VENDOR)
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Post(':id/deliver')
  @ApiOperation({
    summary: 'Vendor marks order as delivered',
  })
  @ApiBody({
    type: EmptyOrderActionDto,
    description:
      'Target identified by URL parameter id. Pass an empty object {}',
  })
  markAsDelivered(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: EmptyOrderActionDto,
  ) {
    console.log('========================================');
    console.log('🚚 MARK ORDER AS DELIVERED');
    console.log('========================================');

    console.log('Order ID:', id);
    console.log('User:', req.user);
    console.log('User ID:', req.user.id);

    return this.ordersService.markAsDelivered(
      id,
      req.user.id,
    );
  }

  /* ==========================================================================
     COMPLETE ORDER (USER)
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  @ApiOperation({
    summary: 'User marks order as complete (Releases escrow)',
  })
  @ApiBody({
    type: EmptyOrderActionDto,
    description:
      'Target identified by URL parameter id. Pass an empty object {}',
  })
  completeOrder(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: EmptyOrderActionDto,
  ) {
    console.log('========================================');
    console.log('💰 COMPLETE ORDER');
    console.log('========================================');

    console.log('Order ID:', id);
    console.log('User:', req.user);
    console.log('User ID:', req.user.id);

    return this.ordersService.completeOrder(
      id,
      req.user.id,
    );
  }

  /* ==========================================================================
     REJECT ORDER (VENDOR)
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  @ApiOperation({
    summary: 'Vendor rejects an order (Triggers wallet refund)',
  })
  @ApiBody({
    type: EmptyOrderActionDto,
    description:
      'Target identified by URL parameter id. Pass an empty object {}',
  })
  rejectOrder(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: EmptyOrderActionDto,
  ) {
    console.log('========================================');
    console.log('❌ REJECT ORDER');
    console.log('========================================');

    console.log('Order ID:', id);
    console.log('User:', req.user);
    console.log('User ID:', req.user.id);

    return this.ordersService.rejectOrder(
      id,
      req.user.id,
    );
  }
}