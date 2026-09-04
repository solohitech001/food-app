import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { CartService } from './cart.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
} from './dto/add-to-cart.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current user cart',
    description: 'Retrieves the authenticated user cart and its items.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully.',
  })
  async getCart(@Req() req: any) {
    console.log('Authenticated user:', req.user);

    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException(
        'Authenticated user ID not found.',
      );
    }

    return this.cartService.getCart(userId);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add item to cart',
    description:
      'Adds a food item to the current user cart. Items from different vendors cannot be mixed.',
  })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully.',
  })
  async addToCart(
    @Req() req: any,
    @Body() dto: AddToCartDto,
  ) {
    console.log('Authenticated user:', req);
    console.log('User ID:', req.user?.id);
    console.log('User SUB:', req.user?.sub);

    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException(
        'Authenticated user ID not found.',
      );
    }

    return this.cartService.addToCart(userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({
    summary: 'Update cart item quantity',
  })
  @ApiParam({
    name: 'id',
    description: 'Cart Item ID',
  })
  async updateQuantity(
    @Req() req: any,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException(
        'Authenticated user ID not found.',
      );
    }

    return this.cartService.updateItemQuantity(
      userId,
      itemId,
      dto,
    );
  }

  @Delete('items/:id')
  @ApiOperation({
    summary: 'Remove single item from cart',
  })
  @ApiParam({
    name: 'id',
    description: 'Cart Item ID',
  })
  async removeItem(
    @Req() req: any,
    @Param('id') itemId: string,
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException(
        'Authenticated user ID not found.',
      );
    }

    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  @ApiOperation({
    summary: 'Clear entire cart',
  })
  async clearCart(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException(
        'Authenticated user ID not found.',
      );
    }

    return this.cartService.clearCart(userId);
  }
}