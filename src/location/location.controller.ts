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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { LocationService } from './location.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('location')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly prisma: PrismaService,
  ) {}

  /* ==================================
     USER → UPDATE LOCATION
  ================================== */
  @UseGuards(JwtAuthGuard)
  @Post('user')
  async updateUserLocation(@Req() req: any, @Body() body: any) {
    const { latitude, longitude, city, state } = body;

    if (!latitude || !longitude) {
      throw new ForbiddenException('Latitude and longitude required');
    }

    return this.prisma.user.update({
      where: { id: req.user.id }, // ✅ FIXED
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post('vendor')
  async updateVendorLocation(@Req() req: any, @Body() body: any) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: req.user.id }, // ✅ FIXED
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post('zones')
  async createZone(@Req() req: any, @Body() body: any) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: req.user.id }, // ✅ FIXED
    });

    if (!vendor) throw new ForbiddenException('Vendor not found');

    if (!body.name || !body.polygon) {
      throw new ForbiddenException('Zone name and polygon required');
    }

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Get('zones')
  async getZones(@Req() req: any) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: req.user.id }, // ✅ FIXED
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
  @UseGuards(JwtAuthGuard)
  @Get('can-order/:vendorId')
  async canOrder(@Req() req: any, @Param('vendorId') vendorId: string) {
    const allowed = await this.locationService.canUserOrder(
      req.user.id, // ✅ FIXED
      vendorId,
    );

    return { canOrder: allowed };
  }
}
