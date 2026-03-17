import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: 9.05785 })
  latitude: number;

  @ApiProperty({ example: 7.49508 })
  longitude: number;

  @ApiProperty({ example: 'Abuja' })
  city: string;

  @ApiProperty({ example: 'FCT' })
  state: string;
}