import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationLockType } from '@prisma/client';

export class UpdateVendorProfileDto {
  @ApiPropertyOptional({
    description: 'Vendor business name',
    example: 'Solohitech Food Ventures',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Short description of the vendor business',
    example: 'Home of fresh local dishes and quick bites.',
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
    description: 'City where the vendor operates',
    example: 'Abuja',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State where the vendor operates',
    example: 'FCT',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Vendor phone number',
    example: '+2348012345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Vendor business email',
    example: 'contact@solohitech.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Logo image URL',
    example: 'https://cdn.example.com/logo.jpg',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Cover photo image URL',
    example: 'https://cdn.example.com/cover.jpg',
  })
  @IsOptional()
  @IsString()
  coverPhoto?: string;

  @ApiPropertyOptional({
    description: 'Latitude of vendor location',
    example: 9.0765,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude of vendor location',
    example: 7.3986,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Delivery radius in kilometers',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryRadiusKm?: number;

  @ApiPropertyOptional({
    description: 'Location restriction type',
    enum: LocationLockType,
    enumName: 'LocationLockType',
    example: LocationLockType.RADIUS,
  })
  @IsOptional()
  @IsEnum(LocationLockType)
  locationLockType?: LocationLockType;

  // --- OPERATING HOURS ---

  @ApiPropertyOptional({
    description: 'Opening time',
    example: '08:00 AM',
  })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiPropertyOptional({
    description: 'Closing time',
    example: '10:00 PM',
  })
  @IsOptional()
  @IsString()
  closingTime?: string;

  // --- SOCIAL LINKS ---

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://solohitech.com',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    description: 'Instagram handle or URL',
    example: '@solohitech_foods',
  })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({
    description: 'Facebook handle or page link',
    example: 'solohitechfoods',
  })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional({
    description: 'Twitter/X handle',
    example: '@solohitech',
  })
  @IsOptional()
  @IsString()
  twitter?: string;

  @ApiPropertyOptional({
    description: 'TikTok handle',
    example: '@solohitech',
  })
  @IsOptional()
  @IsString()
  tiktok?: string;

  // --- BANK PAYOUT DETAILS ---

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '0123456789',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'Bank account name',
    example: 'Solohitech Ventures Ltd',
  })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
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