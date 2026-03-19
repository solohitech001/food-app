import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '+2348012345678', description: 'Phone number of user' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}