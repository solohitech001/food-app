import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { LocationService } from './location.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserLocationDto } from './dto/update-location.dto';
import { CreateLocationDto } from './dto/create-location.dto';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly prisma: PrismaService,
  ) {}

  /* ==================================
     USER → UPDATE LOCATION
  ================================== */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user location' })
  @ApiResponse({ status: 200, description: 'User location updated successfully' })
  @UseGuards(JwtAuthGuard)
  @Post('user')
  async updateUserLocation(
    @Req() req: any,
    @Body() body: UpdateUserLocationDto,
  ) {
    const { latitude, longitude, city, state } = body;

    if (!latitude || !longitude) {
      throw new ForbiddenException('Latitude and longitude required');
    }

    return this.prisma.user.update({
      where: { id: req.user.id },
      data: {
        latitude,
        longitude,
        city,
        state,
      },
    });
  }

  /* ==================================
     VENDOR → UPDATE LOCATION
  ================================== */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor location' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post('vendor')
  async updateVendorLocation(
    @Req() req: any,
    @Body() body: UpdateUserLocationDto,
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendor) throw new ForbiddenException('Vendor not found');

    return this.prisma.vendor.update({
      where: { id: vendor.id },
      data: body,
    });
  }

  /* ==================================
     VENDOR → CREATE DELIVERY ZONE
  ================================== */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create delivery zone for vendor' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post('zones')
  async createZone(
    @Req() req: any,
    @Body() body: CreateLocationDto,
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendor) throw new ForbiddenException('Vendor not found');

    return this.prisma.vendorZone.create({
      data: {
        vendorId: vendor.id,
        name: body.name,
        polygon: body.polygon,
      },
    });
  }

  /* ==================================
     VENDOR → LIST DELIVERY ZONES
  ================================== */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor delivery zones' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Get('zones')
  async getZones(@Req() req: any) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendor) {
      throw new ForbiddenException('Vendor not found');
    }

    return this.prisma.vendorZone.findMany({
      where: { vendorId: vendor.id },
    });
  }

  /* ==================================
     PUBLIC → CHECK DELIVERY AVAILABILITY
  ================================== */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user can order from vendor' })
  @ApiResponse({
    status: 200,
    description: 'Returns whether user can order',
    schema: {
      example: {
        canOrder: true,
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('can-order/:vendorId')
  async canOrder(@Req() req: any, @Param('vendorId') vendorId: string) {
    const allowed = await this.locationService.canUserOrder(
      req.user.id,
      vendorId,
    );

    return { canOrder: allowed };
  }
}