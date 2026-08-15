import { ApiProperty } from '@nestjs/swagger';
import { FoodFeedDto } from './food-feed.dto';

export class FoodFeedPaginationDto {
  @ApiProperty({
    type: [FoodFeedDto],
    description: 'Food items returned for this page',
  })
  data: FoodFeedDto[];

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items requested',
  })
  limit: number;

  @ApiProperty({
    example: true,
    description: 'Whether another page is available',
  })
  hasNextPage: boolean;

  @ApiProperty({
    example: 2,
    nullable: true,
    description: 'Next page number, or null if there is no next page',
  })
  nextPage: number | null;
}