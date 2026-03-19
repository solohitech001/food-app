import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

export enum VendorStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
}

export class GetVendorsDto {
  @ApiPropertyOptional({
    description: 'Filter vendors by status',
    enum: VendorStatus,
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;
}