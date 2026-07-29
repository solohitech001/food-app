import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  BestSellingFoodDto,
  SearchMarketplaceResponseDto,
  VendorSummaryDto,
  VendorFullProfileResponseDto,
} from './dto/marketplace-and-onboarding.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { VendorsService } from './vendors.service';

import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { UploadVendorDocumentDto } from './dto/upload-vendor-document.dto';
import { GetVendorsDto } from './dto/get-vendors.dto';
import { ApproveRejectVendorDto } from './dto/ApproveRejectDocumentDto';
import {
  NotificationActionSuccessResponseDto,
  SendNotificationDto,
  UnreadNotificationCountResponseDto,
  VendorNotificationResponseDto,
} from './dto/send-notification.dto';
import { VendorLevel } from '@prisma/client';
import {
  VendorDocumentResponseDto,
  VendorProfileResponseDto,
} from './dto/vendor-profile-response.dto';
import { VendorRevenueResponseDto } from './dto/vendor-revenue-response.dto';
import { VendorStatsResponseDto } from './dto/vendor-stats-response.dto';
import { UserActivityResponseDto } from './dto/user-activity-response.dto';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';
import { VendorMetricsResponseDto } from './dto/vendor-metrics-response.dto';
import { FoodItemCatalogResponseDto } from './dto/catalog-and-documents.dto';
import {
  AdminActionSuccessResponseDto,
  AdminVendorDocumentResponseDto,
  AdminVendorListItemDto,
} from './dto/admin-vendor-management.dto';
import { PaymentSetupDto } from './dto/payment-setup.dto';
import { VerifyBankDto, VerifyBankResponseDto } from './dto/verify-bank.dto';
import {
  VendorOrderQueryDto,
  VendorOrdersResponseDto,
} from './dto/vendor-order-query.dto';
import { VendorOrderDetailsResponseDto } from './dto/vendor-order-details.dto';
import { VendorActionResponseDto } from './dto/vendor-order-action.dto';

@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  // =========================================================================
  // DASHBOARD &  METRICS
  // =========================================================================

  @Get('dashboard/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dashboard overview',
    description:
      'Retrieves a combined overview of user consumer activity and vendor performance metrics (if the user is a registered vendor).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard overview fetched successfully.',
    type: DashboardOverviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer Token.',
  })
  async getDashboardSummary(@Req() req) {
    return this.vendorsService.getDashboardOverview(req.user.id);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get vendor metrics',
    description:
      'Fetches total, successful, cancelled, and pending order breakdown along with fulfillment metrics for the authenticated vendor.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor order metrics returned successfully.',
    type: VendorMetricsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Requires VENDOR role or user is not linked to a vendor profile.',
  })
  async getVendorMetrics(@Req() req) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);
    return this.vendorsService.getVendorMetrics(vendor.id);
  }

  @Get('user-activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user consumer activity',
    description:
      'Fetches total orders placed, unique vendors visited, and unique meals ordered by the logged-in user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User consumer activity stats returned successfully.',
    type: UserActivityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  async getUserActivity(@Req() req) {
    return this.vendorsService.getUserActivity(req.user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get overall vendor statistics',
    description:
      'Fetches total count of catalog foods, total reviews, revenue, average rating, and unread notifications count for the authenticated vendor.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor statistics retrieved successfully.',
    type: VendorStatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Access denied. Requires VENDOR role linked to an active profile.',
  })
  async getVendorStats(@Req() req) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);
    return this.vendorsService.getVendorStats(vendor.id);
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get vendor total revenue',
    description:
      'Aggregates total gross revenue earned from all completed orders for the authenticated vendor.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Total revenue sum returned successfully.',
    type: VendorRevenueResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer Token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have the VENDOR role or is not linked to a vendor profile.',
  })
  async getVendorRevenue(@Req() req) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);
    return this.vendorsService.getVendorRevenue(vendor.id);
  }

  @Get('best-selling')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get top 10 best-selling foods',
    description: 'Ranks vendor items based on total order quantity fulfilled.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of top-selling food items returned.',
    type: [BestSellingFoodDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires VENDOR role.',
  })
  async getBestSellingFoods(@Req() req) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);
    return this.vendorsService.getBestSellingFoods(vendor.id);
  }

  // =========================================================================
  // SEARCH & PUBLIC EXPLORATION
  // =========================================================================

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search marketplace',
    description:
      'Searches both vendors (by name, city, state) and food items (by name, description).',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search string query',
    example: 'Burger',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Matching vendors and meals returned.',
    type: SearchMarketplaceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  async searchMarket(@Query('q') q: string) {
    return this.vendorsService.searchMarketplace(q);
  }

  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get active vendors by city',
    description: 'Retrieves active vendors located within a specific city.',
  })
  @ApiQuery({
    name: 'city',
    required: true,
    description: 'City name',
    example: 'Abuja',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of nearby vendors returned.',
    type: [VendorSummaryDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  async getNearbyVendors(@Query('city') city: string) {
    return this.vendorsService.getNearbyVendors(city);
  }

  @Get('top-rated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get top 10 rated vendors',
    description:
      'Retrieves top-performing active vendors ordered by highest average rating.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top-rated active vendors returned.',
    type: [VendorSummaryDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  async getTopRatedVendors() {
    return this.vendorsService.getTopRatedVendors();
  }

  @Get('filter')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Filter active vendors',
    description: 'Filters active vendors by city, state, or vendor tier level.',
  })
  @ApiQuery({ name: 'city', required: false, example: 'Abuja' })
  @ApiQuery({ name: 'state', required: false, example: 'FCT' })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: VendorLevel,
    enumName: 'VendorLevel',
    description: 'Vendor Level Tier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Filtered list of active vendors returned.',
    type: [VendorSummaryDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  async filterVendors(
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('level') level?: VendorLevel,
  ) {
    return this.vendorsService.filterVendors(city, state, level);
  }

  // =========================================================================
  // VENDOR ONBOARDING & PROFILE MANAGEMENT
  // =========================================================================

  @Post('onboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Onboard a new vendor',
    description:
      'Creates a vendor entry with comprehensive business details (address, bank payout info, hours, socials, etc.) bound to the logged-in user. User must be verified.',
  })
  @ApiBody({ type: CreateVendorDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vendor account successfully created with PENDING status.',
    type: VendorFullProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User unverified or vendor already exists.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  async createVendor(@Req() req, @Body() dto: CreateVendorDto) {
    return this.vendorsService.createVendor(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get authenticated user vendor profile',
    description:
      'Fetches full details of the logged-in user vendor profile, including badges, foods, and reviews.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor profile details fetched.',
    type: VendorFullProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Vendor profile does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  async getMyVendorProfile(@Req() req) {
    return this.vendorsService.getVendorByUserId(req.user.id);
  }

  @Patch(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR', 'ADMIN')
  @ApiOperation({
    summary: 'Update vendor profile',
    description:
      'Updates business metadata, operating coordinates, and delivery preferences.',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID UUID' })
  @ApiBody({ type: UpdateVendorProfileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor profile successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Vendor not found.',
  })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.updateVendorProfile(id, dto);
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get vendor profile by ID',
    description:
      'Fetches public vendor details including wallet, reviews, badges, food catalog, and verification documents.',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Vendor profile details retrieved successfully with relational entities.',
    type: VendorProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor with the provided ID does not exist.',
  })
  async getVendorProfile(@Param('id') vendorId: string) {
    return this.vendorsService.getVendorProfile(vendorId);
  }

  @Get(':id/foods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get food catalog for vendor',
    description:
      'Fetches all active food/meal offerings registered under a specific vendor.',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Food items retrieved successfully.',
    type: [FoodItemCatalogResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor profile not found.',
  })
  async getVendorFoods(@Param('id') vendorId: string) {
    return this.vendorsService.getVendorFoods(vendorId);
  }

  // =========================================================================
  // DOCUMENTS & VERIFICATION
  // =========================================================================

  @Post('documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload verification document',
    description:
      'Uploads identification or business documents (NIN, CAC, etc.) to S3 object storage for administrative review.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadVendorDocumentDto,
    description: 'Identity or registration document payload with binary file.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded and set to PENDING verification status.',
    type: VendorDocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input payload, missing file, or vendor profile not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  async uploadDocument(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadVendorDocumentDto,
  ) {
    return this.vendorsService.uploadVendorDocument(
      req.user.id,
      dto.type,
      file,
    );
  }

  // =========================================================================
  // VENDOR NOTIFICATIONS
  // =========================================================================

  @Get('notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get vendor notifications',
    description:
      'Fetches all notifications sent to the vendor ordered by creation date.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification list retrieved successfully.',
    type: [VendorNotificationResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires VENDOR role.',
  })
  async getNotifications(@Req() req) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);
    return this.vendorsService.getNotifications(vendor.id);
  }

  @Get('notifications/unread-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get unread notification count',
    description:
      'Retrieves the current integer total of unread vendor notifications.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread notification count returned.',
    type: UnreadNotificationCountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing  or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires VENDOR role.',
  })
  async getUnreadCount(@Req() req) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);
    return this.vendorsService.unreadNotificationCount(vendor.id);
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Flags a specific notification as read by notification ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID UUID',
    example: 'c123-uuid-456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read.',
    type: VendorNotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification with the given ID was not found.',
  })
  async markNotificationAsRead(@Param('id') id: string) {
    return this.vendorsService.markNotificationAsRead(id);
  }

  @Delete('notifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Permanently removes a notification entry.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID UUID',
    example: 'c123-uuid-456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully.',
    type: NotificationActionSuccessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification with the given ID was not found.',
  })
  async deleteNotification(@Param('id') id: string) {
    return this.vendorsService.deleteNotification(id);
  }

  // =========================================================================
  // ADMINISTRATIVE ENDPOINTS (ADMIN ONLY)
  // =========================================================================

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all vendors (Admin)',
    description:
      'Retrieves all vendors or filters vendors by their verification status.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor records retrieved successfully.',
    type: [AdminVendorListItemDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires ADMIN role.',
  })
  async getAll(@Query() query: GetVendorsDto) {
    if (query.status) {
      return this.vendorsService.getVendorsByStatus(query.status);
    }
    return this.vendorsService.getAllVendors();
  }

  @Get(':id/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get documents submitted by vendor (Admin)',
    description: 'Fetches verification documents uploaded by a vendor.',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor documents listed.',
    type: [AdminVendorDocumentResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor ID not found.',
  })
  async getVendorDocuments(@Param('id') vendorId: string) {
    return this.vendorsService.getVendorDocuments(vendorId);
  }

  @Post('documents/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve vendor document (Admin)',
    description:
      'Approves document status and upgrades the linked user role to VENDOR.',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor Document ID UUID',
    example: 'doc-uuid-999',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document approved and user role elevated to VENDOR.',
    type: AdminVendorDocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document ID not found.',
  })
  async approveDocument(@Param('id') id: string) {
    return this.vendorsService.approveDocument(id);
  }

  @Post('documents/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject vendor document (Admin)',
    description: 'Rejects a vendor document with an optional review comment.',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor Document ID UUID',
    example: 'doc-uuid-999',
  })
  @ApiBody({ type: ApproveRejectVendorDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document marked as REJECTED.',
    type: AdminVendorDocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document ID not found.',
  })
  async rejectDocument(
    @Param('id') id: string,
    @Body() dto: ApproveRejectVendorDto,
  ) {
    return this.vendorsService.rejectDocument(id, dto.comment);
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Suspend vendor (Admin)',
    description: 'Sets vendor operating status to SUSPENDED.',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor suspended.',
    type: AdminVendorListItemDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor ID not found.',
  })
  async suspendVendor(@Param('id') vendorId: string) {
    return this.vendorsService.suspendVendor(vendorId);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Activate vendor (Admin)',
    description: 'Sets vendor operating status to ACTIVE.',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor activated.',
    type: AdminVendorDocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor ID not found.',
  })
  async activateVendor(@Param('id') vendorId: string) {
    return this.vendorsService.activateVendor(vendorId);
  }

  @Post(':id/notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send notification to vendor (Admin)',
    description:
      'Dispatches a custom notification message to a specific vendor.',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification sent successfully.',
    type: VendorNotificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor ID not found.',
  })
  async sendNotification(
    @Param('id') vendorId: string,
    @Body() dto: SendNotificationDto,
  ) {
    return this.vendorsService.createNotification(
      vendorId,
      dto.title,
      dto.message,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete vendor (Admin)',
    description: 'Permanently deletes a vendor record.',
  })
  @ApiParam({
    name: 'id',
    description: 'Vendor ID UUID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor deleted successfully.',
    type: AdminActionSuccessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid Bearer token.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires ADMIN role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor ID not found.',
  })
  async deleteVendor(@Param('id') vendorId: string) {
    return this.vendorsService.deleteVendor(vendorId);
  }

  @Patch('payment-setup')
  @UseGuards(JwtAuthGuard)
  setupPayment(@Req() req, @Body() dto: PaymentSetupDto) {
    return this.vendorsService.setupPayment(req.user.vendorId, dto);
  }

  @ApiOkResponse({
    type: VerifyBankResponseDto,
  })
  @Post('payment/verify-bank')
  verifyBank(@Body() dto: VerifyBankDto) {
    return this.vendorsService.verifyBank(dto);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get vendor orders',
    description:
      'Returns all orders belonging to the authenticated vendor with optional filtering.',
  })
  @ApiOkResponse({
    description: 'Vendor orders fetched successfully.',
    type: VendorOrdersResponseDto,
    isArray: true,
  })
  async getVendorOrders(@Req() req, @Query() query: VendorOrderQueryDto) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);

    return this.vendorsService.getVendorOrders(vendor.id, query);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get vendor order details',
    description:
      'Returns complete information about a specific order belonging to the authenticated vendor.',
  })
  @ApiParam({
    name: 'id',
    example: '6df3b9d5-a21d-40d8-9c62-fd7fbe5c1234',
  })
  @ApiOkResponse({
    type: VendorOrderDetailsResponseDto,
  })
  async getVendorOrderDetails(@Req() req, @Param('id') orderId: string) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);

    return this.vendorsService.getVendorOrderDetails(vendor.id, orderId);
  }

  @Patch('orders/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept an order',
    description:
      'Allows the authenticated vendor to accept a pending order and begin preparation.',
  })
  @ApiParam({
    name: 'id',
    example: '0a4e8f76-2a35-4a8f-90b2-1abcefd78901',
  })
  @ApiOkResponse({
    type: VendorActionResponseDto,
  })
  async acceptOrder(@Req() req, @Param('id') orderId: string) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);

    return this.vendorsService.acceptOrder(vendor.id, orderId);
  }

  @Patch('orders/:id/start-preparing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Start preparing an order',
    description:
      'Allows the authenticated vendor to start preparing an accepted order.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: '04e8f76-2a35-4a8f-90b2-1abcefd78901',
  })
  @ApiOkResponse({
    description: 'Order preparation started successfully.',
    schema: {
      example: {
        success: true,
        message: 'Order is now being prepared.',
        data: {
          id: '04e8f76-2a35-4a8f-90b2-1abcefd78901',
          status: 'PREPARING',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Only accepted orders can be prepared.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  async startPreparing(@Req() req, @Param('id') orderId: string) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);

    return this.vendorsService.startPreparing(vendor.id, orderId);
  }

  @Patch('orders/:id/ready')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark order as ready',
    description:
      'Allows the authenticated vendor to mark a preparing order as ready for pickup by the rider.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: '04e8f76-2a35-4a8f-90b2-1abcefd78901',
  })
  @ApiOkResponse({
    description: 'Order marked as ready successfully.',
    schema: {
      example: {
        success: true,
        message: 'Order is ready for pickup.',
        data: {
          id: '04e8f76-2a35-4a8f-90b2-1abcefd78901',
          status: 'READY',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Only preparing orders can be marked as ready.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  async markOrderReady(@Req() req, @Param('id') orderId: string) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.id);

    return this.vendorsService.markOrderReady(vendor.id, orderId);
  }
}
