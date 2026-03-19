import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum DocumentType {
  NIN = 'NIN',
  PASSPORT = 'PASSPORT',
  CAC = 'CAC',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
}

export class UploadVendorDocumentDto {
  @ApiProperty({
    description: 'Type of document being uploaded',
    enum: DocumentType,
    example: 'NIN',
  })
  @IsEnum(DocumentType)
  type: DocumentType;
}