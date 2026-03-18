import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '+2348012345678', description: 'Phone number of user' })
  phoneNumber: string;
}