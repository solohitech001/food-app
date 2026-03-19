import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+2348012345678', description: 'Phone number of user' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: 'OTP sent to user' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}