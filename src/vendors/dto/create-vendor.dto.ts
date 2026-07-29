import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { LocationLockType } from '@prisma/client';

export class CreateVendorDto {
  @ApiProperty({
    description: 'Name of the vendor or business',
    example: 'Solohitech Food Ventures',
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({
    description: 'Short description of the vendor/business',
    example: 'The home of authentic local dishes and fast food.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Physical address of the vendor',
    example: '123 Main Street, Garki',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Operating city',
    example: 'Abuja',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Operating state',
    example: 'FCT',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Business contact phone number',
    example: '+2348012345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Business email address',
    example: 'contact@solohitech.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate for GPS mapping',
    example: 9.0765,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate for GPS mapping',
    example: 7.3986,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Daily opening time (e.g., 08:00 AM)',
    example: '08:00 AM',
  })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiPropertyOptional({
    description: 'Daily closing time (e.g., 10:00 PM)',
    example: '10:00 PM',
  })
  @IsOptional()
  @IsString()
  closingTime?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://solohitech.com',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Instagram handle or URL', example: '@solohitech_foods' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ description: 'Facebook page or handle', example: 'solohitechfoods' })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional({ description: 'Twitter/X handle', example: '@solohitech' })
  @IsOptional()
  @IsString()
  twitter?: string;

  @ApiPropertyOptional({ description: 'TikTok handle', example: '@solohitech' })
  @IsOptional()
  @IsString()
  tiktok?: string;

  @ApiPropertyOptional({
    description: 'Max delivery radius in kilometers',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  deliveryRadiusKm?: number;

  @ApiPropertyOptional({
    description: 'Type of location locking mechanism applied',
    enum: LocationLockType,
    example: LocationLockType.RADIUS,
  })
  @IsOptional()
  @IsEnum(LocationLockType)
  locationLockType?: LocationLockType;

  // --- BANK PAYOUT DETAILS ---

  @ApiPropertyOptional({
    description: 'Bank account number for payouts',
    example: '0123456789',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'Name on the bank account',
    example: 'Solohitech Ventures Ltd',
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({
    description: 'Bank Name',
    example: 'GTBank',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Bank CBN code',
    example: '058',
  })
  @IsOptional()
  @IsString()
  bankCode?: string;
}