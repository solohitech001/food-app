import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+2348012345678', description: 'Phone number of user' })
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: 'OTP sent to user' })
  otp: string;
}