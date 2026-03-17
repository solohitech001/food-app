import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '08012345678', description: 'Phone number of user' })
  phoneNumber: string;
}