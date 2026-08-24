import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive, IsOptional } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'The UUID of the food item to add',
    example: 'd3b07384-d113-44a6-a71f-41f150000000',
  })
  @IsString()
  foodId: string;

  @ApiProperty({
    description: 'Quantity of the item',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Optional vendor ID for validation',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  })
  @IsOptional()
  @IsString()
  vendorId?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity for the item',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  quantity: number;
}