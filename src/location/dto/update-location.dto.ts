import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserLocationDto {
  @ApiProperty({
    example: 6.5244,
    description: 'Latitude of the user location',
  })
  latitude: number;

  @ApiProperty({
    example: 3.3792,
    description: 'Longitude of  the user location',
  })
  longitude: number;

  @ApiProperty({
    example: 'Lagos',
    description: 'City where the user is located',
    required: false,
  })
  city?: string;

  @ApiProperty({
    example: 'Lagos State',
    description: 'State where the user is located',
    required: false,
  })
  state?: string;
}