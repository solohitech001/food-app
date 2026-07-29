import { ApiProperty } from '@nestjs/swagger';

export class VendorRevenueResponseDto {
  @ApiProperty({
    description: 'Total revenue sum earned from completed orders',
    example: 450000.0,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Total count of completed orders counted in revenue',
    example: 120,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Currency of the aggregated revenue',
    example: 'NGN',
  })
  currency: string;
}