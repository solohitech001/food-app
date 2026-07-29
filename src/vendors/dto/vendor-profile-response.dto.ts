import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorStatus, LocationLockType, VendorLevel, DocumentStatus, VendorDocumentType } from '@prisma/client';

export class WalletResponseDto {
  @ApiProperty({ example: 'w123-uuid' })
  id: string;

  @ApiProperty({ example: 250000.50 })
  balance: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty({ example: '1234567890' })
  virtualAccountNumber: string;

  @ApiProperty({ example: 'Wema Bank' })
  virtualBankName: string;
}

export class VendorBadgeResponseDto {
  @ApiProperty({ example: 'badge-123' })
  id: string;

  @ApiProperty({ example: 'TOP_RATED' })
  type: string;

  @ApiProperty({ example: '2026-07-29T12:00:00.000Z' })
  createdAt: Date;
}

export class ReviewResponseDto {
  @ApiProperty({ example: 'rev-123' })
  id: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiPropertyOptional({ example: 'Delicious food and fast delivery!' })
  comment?: string;

  @ApiProperty({ example: 'user-uuid-456' })
  userId: string;

  @ApiProperty({ example: '2026-07-29T12:00:00.000Z' })
  createdAt: Date;
}

export class FoodResponseDto {
  @ApiProperty({ example: 'food-123' })
  id: string;

  @ApiProperty({ example: 'Jollof Rice & Chicken' })
  name: string;

  @ApiPropertyOptional({ example: 'Smokey party jollof with grilled chicken' })
  description?: string;

  @ApiProperty({ example: 3500.0 })
  price: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/jollof.jpg' })
  imageUrl?: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiPropertyOptional({ example: 50 })
  stock?: number;
}

export class VendorDocumentResponseDto {
  @ApiProperty({ example: 'doc-123' })
  id: string;

  @ApiProperty({ enum: VendorDocumentType, example: VendorDocumentType.NIN })
  type: VendorDocumentType;

  @ApiProperty({ example: 'https://cdn.example.com/docs/nin.pdf' })
  fileUrl: string;

  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.APPROVED })
  status: DocumentStatus;

  @ApiPropertyOptional({ example: 'Approved by admin' })
  comment?: string;
}

export class VendorProfileResponseDto {
  @ApiProperty({ example: 'v123-uuid-890' })
  id: string;

  @ApiProperty({ example: 'Solohitech Food Ventures' })
  name: string;

  @ApiProperty({ example: 'user-uuid-123' })
  userId: string;

  @ApiProperty({ enum: VendorStatus, example: VendorStatus.ACTIVE })
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

  @ApiPropertyOptional({ example: 9.0765 })
  latitude?: number;

  @ApiPropertyOptional({ example: 7.3986 })
  longitude?: number;

  @ApiPropertyOptional({ example: '08:00 AM' })
  openingTime?: string;

  @ApiPropertyOptional({ example: '10:00 PM' })
  closingTime?: string;

  @ApiProperty({ example: 4.8 })
  averageRating: number;

  @ApiProperty({ example: 10 })
  deliveryRadiusKm: number;

  @ApiProperty({ enum: LocationLockType, example: LocationLockType.RADIUS })
  locationLockType: LocationLockType;

  @ApiProperty({ enum: VendorLevel, example: VendorLevel.LEVEL_1 })
  level: VendorLevel;

  @ApiPropertyOptional({ example: '0123456789' })
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Solohitech Ventures Ltd' })
  accountName?: string;

  @ApiPropertyOptional({ example: 'GTBank' })
  bankName?: string;

  @ApiPropertyOptional({ example: '058' })
  bankCode?: string;

  @ApiProperty({ type: WalletResponseDto, nullable: true })
  wallet: WalletResponseDto | null;

  @ApiProperty({ type: [VendorBadgeResponseDto] })
  badges: VendorBadgeResponseDto[];

  @ApiProperty({ type: [ReviewResponseDto] })
  reviews: ReviewResponseDto[];

  @ApiProperty({ type: [FoodResponseDto] })
  foods: FoodResponseDto[];

  @ApiProperty({ type: [VendorDocumentResponseDto] })
  vendorDocuments: VendorDocumentResponseDto[];

  @ApiProperty({ example: '2026-07-29T12:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2026-07-29T12:00:00.000Z' })
  updatedAt?: Date;
}