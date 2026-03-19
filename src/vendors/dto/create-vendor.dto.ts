import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({
    description: 'Name of the vendor or business',
    example: 'Solohitech Ventures',
  })
  @IsString()
  @MinLength(3)
  name: string;
}