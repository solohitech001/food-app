import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VendorStatus,
  LocationLockType,
  VendorLevel,
  VendorDocumentType,
  DocumentStatus,
} from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

// =========================================================================
// QUERY DTO FOR GET ALL VENDORS
// =========================================================================

export class GetVendorsDto {
  @ApiPropertyOptional({
    enum: VendorStatus,
    enumName: 'VendorStatus',
    description: 'Filter vendors by status',
    example: VendorStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;
}

// =========================================================================
// REJECT DOCUMENT INPUT DTO
// =========================================================================

export class ApproveRejectVendorDto {
  @ApiPropertyOptional({
    description: 'Reason for rejecting the vendor document',
    example: 'Document photo is unclear or expired. Please upload a clear copy.',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}

// =========================================================================
// ADMIN VENDOR DETAILED RESPONSE DTO
// =========================================================================

export class AdminVendorListItemDto {
  @ApiProperty({ example: 'v123-uuid-890' })
  id: string;

  @ApiProperty({ example: 'Solohitech Food Ventures' })
  name: string;

  @ApiProperty({ example: 'user-uuid-123' })
  userId: string;

  @ApiProperty({ enum: VendorStatus, enumName: 'VendorStatus', example: VendorStatus.ACTIVE })
  status: VendorStatus;

  @ApiPropertyOptional({ example: 'Home of authentic local dishes and fast food.' })
  description?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Garki' })
  address?: string;

  @ApiPropertyOptional({ example: 'Abuja' })
  city?: string;

  @ApiPropertyOptional({ example: 'FCT' })
  state?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'contact@solohitech.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.jpg' })
  logo?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg' })
  coverPhoto?: string;

  @ApiProperty({ example: 4.8 })
  averageRating: number;

  @ApiProperty({ enum: VendorLevel, enumName: 'VendorLevel', example: VendorLevel.LEVEL_1 })
  level: VendorLevel;

  @ApiPropertyOptional({ example: '0123456789' })
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Solohitech Ventures Ltd' })
  accountName?: string;

  @ApiPropertyOptional({ example: 'GTBank' })
  bankName?: string;

  @ApiPropertyOptional({ example: '058' })
  bankCode?: string;

  @ApiProperty({ example: '2026-07-29T12:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2026-07-29T12:00:00.000Z' })
  updatedAt?: Date;
}

// =========================================================================
// ADMIN VENDOR DOCUMENT DETAIL RESPONSE DTO
// =========================================================================

export class AdminVendorDocumentResponseDto {
  @ApiProperty({ example: 'doc-uuid-999' })
  id: string;

  @ApiProperty({
    enum: VendorDocumentType,
    enumName: 'VendorDocumentType',
    example: VendorDocumentType.NIN,
  })
  type: VendorDocumentType;

  @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/docs/nin-12345.pdf' })
  fileUrl: string;

  @ApiProperty({
    enum: DocumentStatus,
    enumName: 'DocumentStatus',
    example: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @ApiPropertyOptional({ example: 'Document verified successfully.' })
  comment?: string;

  @ApiProperty({ example: 'v123-uuid-890' })
  vendorId: string;

  @ApiProperty({ example: '2026-07-29T12:00:00.000Z' })
  createdAt: Date;
}

// =========================================================================
// GENERIC ACTION SUCCESS RESPONSE DTO
// =========================================================================

export class AdminActionSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;
}