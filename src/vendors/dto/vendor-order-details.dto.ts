import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class VendorOrderFoodItemDto {
  @ApiProperty({
    example: '3d9d5f72-5f4d-4d52-8b1f-5c6b9d6b9f12',
  })
  id: string;

  @ApiProperty({
    example: 'Jollof Rice',
  })
  name: string;

  @ApiProperty({
    example: 2500,
  })
  price: number;

  @ApiProperty({
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    example:
      'https://storage.googleapis.com/food-app/jollof-rice.jpg',
  })
  imageUrl: string;
}

export class VendorOrderCustomerDto {
  @ApiProperty({
    example: '5d96d9a4-0c4d-4f7c-93be-d67cb4b35f1b',
  })
  id: string;

  @ApiProperty({
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    example: '08012345678',
  })
  phoneNumber: string;
}

export class VendorOrderDetailsDataDto {
  @ApiProperty({
    example: '6df3b9d5-a21d-40d8-9c62-fd7fbe5c1234',
  })
  id: string;

  @ApiProperty({
    example: 'ORD-20260729-001',
  })
  reference: string;

  @ApiProperty({
    example: 7500,
  })
  amount: number;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PREPARING,
  })
  status: OrderStatus;

  @ApiProperty({
    example: 'PAID',
  })
  paymentStatus: string;

  @ApiProperty({
    example: '2026-07-29T08:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-07-29T08:45:00.000Z',
  })
  acceptBy: Date;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  deliveredAt?: Date;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  completedAt?: Date;

  @ApiProperty({
    type: VendorOrderCustomerDto,
  })
  customer: VendorOrderCustomerDto;

  @ApiProperty({
    type: [VendorOrderFoodItemDto],
  })
  items: VendorOrderFoodItemDto[];
}

export class VendorOrderDetailsResponseDto {
  @ApiProperty({
    example: true,
  })
  success: boolean;

  @ApiProperty({
    example: 'Order retrieved successfully.',
  })
  message: string;

  @ApiProperty({
    type: VendorOrderDetailsDataDto,
  })
  data: VendorOrderDetailsDataDto;
}