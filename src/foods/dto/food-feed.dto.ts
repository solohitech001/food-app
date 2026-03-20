import { ApiProperty } from '@nestjs/swagger';

class VendorDto {
  @ApiProperty({ description: 'Vendor ID', example: 'vendor_123' })
  id: string;

  @ApiProperty({ description: 'Vendor name', example: 'Mama’s Kitchen' })
  name: string;

  @ApiProperty({ description: 'Vendor handle', example: '@mamaskitchen' })
  handle: string;
}

class StatsDto {
  @ApiProperty({ description: 'Number of likes', example: 120 })
  likes: number;

  @ApiProperty({ description: 'Number of saves', example: 45 })
  saves: number;

  @ApiProperty({ description: 'Number of shares', example: 10 })
  shares: number;
}

class ActionsDto {
  @ApiProperty({ description: 'Whether the current user liked this food', example: true })
  liked: boolean;

  @ApiProperty({ description: 'Whether the current user saved this food', example: false })
  saved: boolean;

  @ApiProperty({ description: 'Whether the current user can share this food', example: true })
  canShare: boolean;
}

export class FoodFeedDto {
  @ApiProperty({ description: 'Food ID', example: 'food_987' })
  id: string;

  @ApiProperty({ description: 'Food title or name', example: 'Jollof Rice' })
  title: string;

  @ApiProperty({ description: 'Food description', nullable: true, example: 'Spicy Nigerian Jollof rice with chicken' })
  description: string | null;

  @ApiProperty({ description: 'Food image URL', nullable: true, example: 'https://example.com/images/jollof.jpg' })
  image: string | null;

  @ApiProperty({ description: 'Food video URL', nullable: true, example: 'https://example.com/videos/jollof.mp4' })
  video: string | null;

  @ApiProperty({ description: 'Food price in Naira', example: 2500 })
  price: number;

  @ApiProperty({ description: 'Vendor details', type: VendorDto })
  vendor: VendorDto;

  @ApiProperty({ description: 'Food statistics', type: StatsDto })
  stats: StatsDto;

  @ApiProperty({ description: 'Action permissions for current user', type: ActionsDto })
  actions: ActionsDto;
}