import { ApiProperty } from '@nestjs/swagger';

export class VendorStatsResponseDto {
  @ApiProperty({
    description: 'Total number of food/menu items created by the vendor',
    example: 18,
  })
  totalFoods: number;

  @ApiProperty({
    description: 'Total number of customer reviews received',
    example: 45,
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Total gross revenue earned from completed orders',
    example: 450000.0,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Average rating out of 5 stars',
    example: 4.8,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Count of unread notifications for the vendor',
    example: 3,
  })
  unreadNotificationsCount: number;
}