import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './create-order-item.dto';

export class CreateOrderWithItemsDto {
  @ApiProperty({
    description: 'Vendor ID where the order is being placed',
    example: 'b7c9f6b1-3a4e-4b8e-9c1d-123456789abc',
  })
  @IsUUID()
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