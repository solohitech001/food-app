import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
} from 'class-validator';

import { Type } from 'class-transformer';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MealType, PreparationType } from '@prisma/client';

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
    description: 'Type of meal PLATE, DRINK, PLATTER, SIZZLE',
    enum: MealType,
    example: MealType.PLATE,
  })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiPropertyOptional({
    description: 'How the meal is prepared',
    enum: PreparationType,
    example: PreparationType.READY,
  })
  @IsOptional()
  @IsEnum(PreparationType)
  preparationType?: PreparationType;

  @ApiPropertyOptional({
    description: 'URL of the food image',
    example: 'https://example.com/jollof-rice.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'URL of the food video/media',
    example: 'https://example.com/jollof-rice.mp4',
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the food is currently available',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Available stock quantity',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stock?: number;
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
    description: 'Updated meal type',
    enum: MealType,
    example: MealType.PLATE,
  })
  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @ApiPropertyOptional({
    description: 'Updated preparation type',
    enum: PreparationType,
    example: PreparationType.BY_ORDER,
  })
  @IsOptional()
  @IsEnum(PreparationType)
  preparationType?: PreparationType;

  @ApiPropertyOptional({
    description: 'Updated food image URL',
    example: 'https://example.com/food.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Updated food video/media URL',
    example: 'https://example.com/food-video.mp4',
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the food is available',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Updated stock quantity',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stock?: number;
}

export class EmptyActionDto {}
