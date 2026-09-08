import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({
    description: 'Food ID',
    example: 'food-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  foodId: string;

  @ApiProperty({
    description: 'Quantity of the food item',
    example: 2,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderWithItemsDto {
  @ApiProperty({
    description: 'Vendor ID',
    example: 'vendor-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({
    description: 'List of items in the order',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class EmptyOrderActionDto {}