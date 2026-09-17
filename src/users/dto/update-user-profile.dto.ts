
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsUrl,
} from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'Solomon',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'Solomon John',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the user',
    example: '+2349076907017',
  })
  @IsOptional()
  @IsPhoneNumber('NG')
  phone?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://link-to-image.com/pic.png',
  })
  @IsOptional()
  @IsUrl()
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'Email of the user',
    example: 'newemail@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'City of the user',
    example: 'Lagos',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State of the user',
    example: 'Lagos',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

