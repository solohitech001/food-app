import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorDocumentType, DocumentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

// =========================================================================
// FOOD CATALOG RESPONSE DTO
// =========================================================================

export class FoodItemCatalogResponseDto {
  @ApiProperty({ example: 'food-uuid-123' })
  id: string;

  @ApiProperty({ example: 'Jollof Rice & Chicken' })
  name: string;

  @ApiPropertyOptional({ example: 'Smokey party jollof served with grilled chicken' })
  description?: string;

  @ApiProperty({ example: 3500.0 })
  price: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/jollof.jpg' })
  imageUrl?: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiPropertyOptional({ example: 45, description: 'Current available stock unit count' })
  stock?: number;

  @ApiProperty({ example: 'cat-uuid-456' })
  categoryId: string;

  @ApiProperty({ example: 'v123-uuid-890' })
  vendorId: string;

  @ApiProperty({ example: '2026-07-29T12:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2026-07-29T12:00:00.000Z' })
  updatedAt?: Date;
}

// =========================================================================
// MULTIPART DOCUMENT UPLOAD INPUT DTO
// =========================================================================

export class UploadVendorDocumentDto {
  @ApiProperty({
    enum: VendorDocumentType,
    enumName: 'VendorDocumentType',
    description: 'Type of identity or business document being uploaded',
    example: VendorDocumentType.NIN,
  })
  @IsNotEmpty()
  @IsEnum(VendorDocumentType)
  type: VendorDocumentType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Binary document file (PDF, PNG, JPG)',
  })
  file: any;
}

// =========================================================================
// DOCUMENT UPLOAD RESPONSE DTO
// =========================================================================

export class VendorDocumentResponseDto {
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

  @ApiPropertyOptional({ example: 'Under review by verification team' })
  comment?: string;

  @ApiProperty({ example: 'v123-uuid-890' })
  vendorId: string;

  @ApiProperty({ example: '2026-07-29T12:00:00.000Z' })
  createdAt: Date;
}