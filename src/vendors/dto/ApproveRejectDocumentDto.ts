import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveRejectVendorDto {
  @ApiPropertyOptional({
    description: 'Reason for rejecting the document',
    example: 'Blurry document or invalid details',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}