import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({
    description: 'Food ID',
    example: 'b9ba5b0c-4e9f-4394-8e32-d5b2ca9d718c',
  })
  @IsString()
  @IsNotEmpty()
  foodId: string;

  @ApiProperty({
    description: 'Quantity of the food',
    example: 2,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderWithItemsDto {
  @ApiProperty({
    description: 'Vendor ID',
    example: 'f934369d-bb69-4a08-a5e8-d7e9cafdf185',
  })
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @ApiProperty({
    description: 'List of food items',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class EmptyOrderActionDto {}