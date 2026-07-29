import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class VendorOrderQueryDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    description: 'Filter vendor orders by status.',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class VendorOrderItemResponseDto {
  @ApiProperty({
    example: '3fd0d5d6-6b2d-4d9e-a98b-4dcf14a1a2d3',
  })
  id: string;

  @ApiProperty({
    example: 'ORD-20260729-0001',
  })
  reference: string;

  @ApiProperty({
    example: 'f6df5b74-9e47-4d4f-98cb-cbb9cf0f87ea',
  })
  customerId: string;

  @ApiProperty({
    example: 8500,
  })
  amount: number;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    example: 'PAID',
  })
  paymentStatus: string;

  @ApiProperty({
    example: '2026-07-29T10:15:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-07-29T10:35:00.000Z',
  })
  acceptBy: Date;

  @ApiPropertyOptional({
    example: '2026-07-29T11:05:00.000Z',
    nullable: true,
  })
  deliveredAt?: Date;

  @ApiPropertyOptional({
    example: '2026-07-29T11:15:00.000Z',
    nullable: true,
  })
  completedAt?: Date;
}

export class VendorOrdersResponseDto {
  @ApiProperty({
    example: true,
  })
  success: boolean;

  @ApiProperty({
    example: 'Vendor orders fetched successfully.',
  })
  message: string;

  @ApiProperty({
    type: [VendorOrderItemResponseDto],
  })
  data: VendorOrderItemResponseDto[];
}