import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserActivityResponseDto } from './user-activity-response.dto';
import { VendorStatsResponseDto } from './vendor-stats-response.dto';

export class DashboardOverviewResponseDto {
  @ApiProperty({
    description: 'Consumer activity stats for the authenticated user',
    type: UserActivityResponseDto,
  })
  userActivity: UserActivityResponseDto;

  @ApiPropertyOptional({
    description:
      'Vendor metrics if the user is a registered vendor; returns null for non-vendor accounts',
    type: VendorStatsResponseDto,
    nullable: true,
  })
  vendorStats: VendorStatsResponseDto | null;

  @ApiProperty({
    description: 'Flag indicating whether the current user account is linked to a vendor profile',
    example: true,
  })
  isVendor: boolean;
}