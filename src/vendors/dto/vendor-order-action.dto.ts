import { ApiProperty } from '@nestjs/swagger';

export class VendorActionResponseDto {
  @ApiProperty({
    example: true,
  })
  success: boolean;

  @ApiProperty({
    example: 'Order accepted successfully.',
  })
  message: string;
}