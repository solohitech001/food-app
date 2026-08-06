import {
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the meal category',
    example: 'Fast Food',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Category image URL',
    example: 'https://cdn.example.com/categories/fast-food.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'Display order of the category',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}