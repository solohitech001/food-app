import { ApiProperty } from '@nestjs/swagger';

export class UserActivityResponseDto {
  @ApiProperty({
    description: 'Total number of orders placed by the user',
    example: 24,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Number of distinct vendors the user has purchased from',
    example: 5,
  })
  uniqueVendorsVisited: number;

  @ApiProperty({
    description: 'Number of distinct meals/items ordered by the user',
    example: 12,
  })
  uniqueMealsOrdered: number;
}