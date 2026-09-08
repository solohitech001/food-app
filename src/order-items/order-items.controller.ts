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
  CreateOrderWithItemsDto,
  EmptyOrderActionDto,
} from './dto/create-order-with-items.dto';

import {
  ApiTags,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Order Items')
@Controller('order-items')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /* ==========================================================================
     CREATE ORDER (USER)
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new order with items' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['vendorId', 'items'],
      properties: {
        vendorId: {
          type: 'string',
          example: 'vendor_clx789abc',
          description: 'The unique database ID of the vendor/restaurant',
        },

        items: {
          type: 'array',
          description: 'List of food items included in this checkout order',
          items: {
            type: 'object',
            required: ['foodId', 'quantity'],
            properties: {
              foodId: {
                type: 'string',
                example: 'food_clx987xyz',
                description:
                  'The unique database ID of the specific food item',
              },

              quantity: {
                type: 'number',
                example: 2,
                description:
                  'The total units ordered for this specific item',
              },
            },
          },
        },
      },
    },
  })
  createOrder(
    @Req() req: any,
    @Body() dto: CreateOrderWithItemsDto,
  ) {
    console.log('Received order creation request:', {
      user: req.user,
      userId: req.user.id,
      dto,
    });

    return this.ordersService.createOrder(
      req.user.id,
      dto,
    );
  }

  /* ==========================================================================
     GET ORDER WITH ITEMS
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get order details with items' })
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  /* ==========================================================================
     ACCEPT ORDER (VENDOR)
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  @ApiOperation({ summary: 'Vendor accepts an order' })
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
    console.log('Accept order:', {
      orderId: id,
      user: req.user,
      userId: req.user.id,
    });

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
  @ApiOperation({ summary: 'Vendor marks order as delivered' })
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
    console.log('Deliver order:', {
      orderId: id,
      user: req.user,
      userId: req.user.id,
    });

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
    console.log('Complete order:', {
      orderId: id,
      user: req.user,
      userId: req.user.id,
    });

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
    console.log('Reject order:', {
      orderId: id,
      user: req.user,
      userId: req.user.id,
    });

    return this.ordersService.rejectOrder(
      id,
      req.user.id,
    );
  }
}