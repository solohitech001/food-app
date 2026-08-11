import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFoodDto {
  @ApiProperty({
    description: 'The name of the food item',
    example: 'Jollof Rice',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Price of the food item in Naira',
    example: 3500,
  })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiPropertyOptional({
    description: 'Optional food description',
    example: 'Spicy Nigerian Jollof Rice served with grilled chicken.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Meal Category ID',
    example: 'd6cb5fd2-fd58-45b4-baf9-4d6b1c5b3d9a',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Meal Sub Category ID',
    example: '8dc4f0d6-7d35-4d0d-8dc5-6d94f8e3b4e1',
  })
  @IsOptional()
  @IsUUID()
  subTypeId?: string;
}

export class UpdateFoodDto {
  @ApiPropertyOptional({
    example: 'Suya-Spiced Jollof Rice',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated spicy Nigerian Jollof Rice.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 4000,
    description: 'Updated price in Naira',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description: 'Updated Meal Category ID',
    example: 'd6cb5fd2-fd58-45b4-baf9-4d6b1c5b3d9a',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Updated Meal Sub Category ID',
    example: '8dc4f0d6-7d35-4d0d-8dc5-6d94f8e3b4e1',
  })
  @IsOptional()
  @IsUUID()
  subTypeId?: string;
}

export class EmptyActionDto {}