import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
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
import { AddToCartDto, UpdateCartItemDto } from './dto/add-to-cart.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully.' })
  getCart(@Req() req) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to  cart successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Item from a different vendor detected or invalid payload.',
  })
  @ApiResponse({ status: 404, description: 'Food item not found or unavailable.' })
  addToCart(@Req() req, @Body() dto: AddToCartDto) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.cartService.addToCart(userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'id', description: 'Cart Item ID' })
  @ApiResponse({ status: 200, description: 'Item quantity updated.' })
  @ApiResponse({ status: 404, description: 'Cart item not found.' })
  updateQuantity(
    @Req() req,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.cartService.updateItemQuantity(userId, itemId, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove single item from cart' })
  @ApiParam({ name: 'id', description: 'Cart Item ID' })
  @ApiResponse({ status: 200, description: 'Item removed from cart.' })
  @ApiResponse({ status: 404, description: 'Cart item not found.' })
  removeItem(@Req() req, @Param('id') itemId: string) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully.' })
  clearCart(@Req() req) {
    const userId = req.user?.id || req.headers['x-user-id'];
    return this.cartService.clearCart(userId);
  }
}