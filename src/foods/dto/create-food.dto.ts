import { ApiProperty } from '@nestjs/swagger';

export class CreateFoodDto {
  @ApiProperty({ description: 'The name of the food item', example: 'Jollof Rice' })
  name: string;

  @ApiProperty({ description: 'The price of the food item', example: '3500' })
  price: string; 

  @ApiProperty({ description: 'Optional food description', example: 'Spicy Nigerian Jollof', required: false })
  description?: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Main food image file' })
  image: any;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Optional food media/video file', required: false })
  media?: any;
}

export class UpdateFoodDto {
  @ApiProperty({ example: 'Suya-Spiced Jollof Rice', required: false })
  name?: string;

  @ApiProperty({ example: 'Updated spicy description', required: false })
  description?: string;

  @ApiProperty({ example: 4000, description: 'Updated price in Naira', required: false })
  price?: number;
}

export class EmptyActionDto {
  // Empty class with description forces Swagger to present an editable JSON block '{}'
}