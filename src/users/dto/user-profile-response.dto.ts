import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ example: 'user-id-uuid' })
  id: string;

  @ApiProperty({ example: 'solomon@gmail.com' })
  // email: string;
  email: string | null;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: 'VENDOR' })
  role: string;

  @ApiProperty({
    description: 'Vendor info if user is a vendor',
    example: {
      id: 'vendor-id-uuid',
      name: 'Solohitech Ventures',
      status: 'PENDING',
    },
    nullable: true,
  })
  vendor?: any;

  @ApiProperty({
    description: 'List of uploaded vendor documents (if vendor exists)',
    example: [],
  })
  documents?: any[];
}