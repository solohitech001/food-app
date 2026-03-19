import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
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
    description: 'Latitude of vendor location',
    example: 9.0765,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude of vendor location',
    example: 7.3986,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Delivery radius in kilometers',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  deliveryRadiusKm?: number;

  @ApiPropertyOptional({
    description: 'Location restriction type',
    enum: LocationLockType,
    example: 'PIN',
  })
  @IsOptional()
  @IsEnum(LocationLockType)
  locationLockType?: LocationLockType;
}