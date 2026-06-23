import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ 
    type: String,
    description: 'The unique database ID of the food item being ordered', 
    example: 'food_clx987xyz123' 
  })
  foodId: string;

  @ApiProperty({ 
    type: Number,
    description: 'The total units ordered for this item', 
    example: 2 
  })
  quantity: number;
}

export class CreateOrderWithItemsDto {
  @ApiProperty({ 
    type: String,
    description: 'The unique ID of the target store/vendor', 
    example: 'vendor_789' 
  })
  vendorId: string;

  @ApiProperty({ 
    type: () => [OrderItemDto], // 👈 Crucial:  The arrow function forces Swagger to read the class configuration inline
    description: 'List of items included in the checkout order',
  })
  items: OrderItemDto[];
}

export class EmptyOrderActionDto {}