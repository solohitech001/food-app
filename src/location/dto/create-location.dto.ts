import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({
    example: 'Wuse Zone',
    description: 'Name of the delivery zone',
  })
  name: string;

  @ApiProperty({
    example: [
      [7.4839, 9.0579],
      [7.4900, 9.0600],
      [7.4800, 9.0650],
    ],
    description:
      'Polygon coordinates in format [longitude, latitude]. Defines delivery area.',
  })
  polygon: [number, number][];
}