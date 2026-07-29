import { ApiProperty } from '@nestjs/swagger';

export class OrderStatusBreakdownDto {
  @ApiProperty({
    description: 'Total number of orders ever placed with the vendor',
    example: 150,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Total completed/successful orders',
    example: 132,
  })
  successfulOrders: number;

  @ApiProperty({
    description: 'Total cancelled or rejected orders',
    example: 10,
  })
  cancelledOrders: number;

  @ApiProperty({
    description: 'Currently active or pending orders awaiting processing',
    example: 8,
  })
  pendingOrders: number;
}

export class VendorMetricsResponseDto {
  @ApiProperty({
    description: 'Aggregated breakdown of order counts by status',
    type: OrderStatusBreakdownDto,
  })
  orders: OrderStatusBreakdownDto;

  @ApiProperty({
    description: 'Total gross revenue generated from successful orders',
    example: 540000.0,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Percentage of total orders completed successfully',
    example: 88.0,
  })
  fulfillmentRatePercentage: number;
}