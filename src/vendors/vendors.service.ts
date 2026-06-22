// src/vendors/vendors.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { DocumentType } from './dto/upload-vendor-document.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Express } from 'express';

@Injectable()
export class VendorsService {
  private s3 = new S3Client({
    region: 'eu-central-1',
    credentials: {
      accessKeyId: 'BO2MFYSYNZCFUV9U8LTN',
      secretAccessKey: 'jaYJNU1qJIV1mIHnjHqmYOY5BfiECurRAiJo0nwV',
    },
    endpoint: 'https://eu-central-1.linodeobjects.com',
  });

  constructor(private prisma: PrismaService) {}

  /* CREATE VENDOR */
  async createVendor(userId: string, name: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.isVerified)
      throw new BadRequestException('Verify your account first');

    const existingVendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });
    if (existingVendor) throw new BadRequestException('Vendor already exists');

    return this.prisma.vendor.create({
      data: {
        name,
        status: 'PENDING',
        user: { connect: { id: userId } },
      },
    });
  }

  /* UPDATE PROFILE */
  async updateVendorProfile(vendorId: string, dto: UpdateVendorProfileDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) throw new ForbiddenException('Vendor not found');

    const data: any = { ...dto };

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data,
    });
  }

  /* UPLOAD DOCUMENT */
  async uploadVendorDocument(
    userId: string,
    type: DocumentType,
    file: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');

    let vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      vendor = await this.prisma.vendor.create({
        data: {
          userId: user.id,
          name: 'Default Vendor Pending',
          status: 'PENDING',
        },
      });
    }

    const fileKey = `${vendor.id}/${randomUUID()}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: 'magikworldgifts',
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const fileUrl = `https://magikworldgifts.eu-central-1.linodeobjects.com/${fileKey}`;

    const document = await this.prisma.vendorDocument.create({
      data: {
        vendorId: vendor.id,
        type,
        fileUrl,
        status: 'PENDING',
      },
    });

    return {
      message: 'Document uploaded successfully. Await admin review.',
      document,
    };
  }

  /* ADMIN: GET ALL */
  async getAllVendors() {
    return this.prisma.vendor.findMany({
      include: { user: true, vendorDocuments: true },
    });
  }

  /* ADMIN: FILTER */
  async getVendorsByStatus(status: any) {
    return this.prisma.vendor.findMany({
      where: { status },
      include: { user: true },
    });
  }

  /* ADMIN: DOCUMENTS */
  async getVendorDocuments(vendorId: string) {
    return this.prisma.vendorDocument.findMany({
      where: { vendorId },
    });
  }

  // src/vendors/vendors.service.ts
  async approveDocument(documentId: string) {
    const doc = await this.prisma.vendorDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
    });

    // Get vendor
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: doc.vendorId },
      include: { user: true },
    });

    // ❌ MISSING: update the user's role
    await this.prisma.user.update({
      where: { id: vendor?.userId },
      data: { role: 'VENDOR' }, // <-- This is what you need
    });

    return doc;
  }

  async rejectDocument(documentId: string, comment?: string) {
    return this.prisma.vendorDocument.update({
      where: { id: documentId },
      data: { status: 'REJECTED', comment: comment || null },
    });
  }

  // Add this method inside your VendorsService class

  /* FETCH METRICS FOR VENDOR DASHBOARD */
  async getVendorMetrics(vendorId: string) {
    const [totalOrders, successful, cancelled, pending] =
      await this.prisma.$transaction([
        // 1. Total Orders assigned to this vendor
        this.prisma.order.count({
          where: { vendorId },
        }),

        // 2. Successful Orders (Mapped to COMPLETED status)
        this.prisma.order.count({
          where: {
            vendorId,
            status: 'COMPLETED',
          },
        }),

        // 3. Cancelled Orders
        this.prisma.order.count({
          where: {
            vendorId,
            status: 'CANCELLED',
          },
        }),

        // 4. Pending Orders (Orders currently active in downstream processing)
        this.prisma.order.count({
          where: {
            vendorId,
            status: { in: ['PENDING', 'PREPARING', 'DELIVERED'] },
          },
        }),
      ]);

    return {
      totalOrders,
      successful,
      cancelled,
      pending,
    };
  }

  /* FETCH HISTORICAL CONSUMER ACTIVITY FOR USER */
  async getUserActivity(userId: string) {
    // 1. Get total order volume placed by user
    const totalOrdersCount = await this.prisma.order.count({
      where: { userId },
    });

    // 2. Get count of distinct vendors the user has purchased meals from
    const distinctVendorsAggregation = await this.prisma.order.groupBy({
      by: ['vendorId'],
      where: { userId },
    });
    const uniqueVendorsCount = distinctVendorsAggregation.length;

    // 3. Get total distinct unique dishes/meals ordered by the user
    const userOrders = await this.prisma.order.findMany({
      where: { userId },
      select: {
        items: {
          select: { foodId: true },
        },
      },
    });

    const uniqueFoodIds = new Set<string>();
    userOrders.forEach((order) => {
      order.items.forEach((item) => uniqueFoodIds.add(item.foodId));
    });

    return {
      orders: totalOrdersCount,
      vendors: uniqueVendorsCount,
      meals: uniqueFoodIds.size,
    };
  }

  // Add this method inside your VendorsService class

  /* GET COMBINED DASHBOARD OVERVIEW FOR A USER */
  async getDashboardOverview(userId: string) {
    // 1. Get user consumer activity metrics
    const activity = await this.getUserActivity(userId);

    // 2. Default fallback metrics structure
    let vendorMetrics = {
      totalOrders: 0,
      successful: 0,
      cancelled: 0,
      pending: 0,
    };

    // 3. Find if this user is a registered vendor
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    // 4. If they are a vendor, populate metrics
    if (vendor) {
      vendorMetrics = await this.getVendorMetrics(vendor.id);
    }

    return {
      vendorMetrics,
      activity,
    };
  }

  // Add to src/vendors/vendors.service.ts

  /* SEARCH MEALS AND VENDORS */
  async searchMarketplace(searchQuery?: string) {
    // If no query string is provided, return empty collections safely
    if (!searchQuery || !searchQuery.trim()) {
      return { vendors: [], meals: [] };
    }

    const cleanQuery = searchQuery.trim();

    // Query both tables simultaneously using an optimized Promise wrapper
    const [vendors, meals] = await Promise.all([
      // 1. Search Vendors table matching by name, city, or state
      this.prisma.vendor.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: 'insensitive' } },
            { city: { contains: cleanQuery, mode: 'insensitive' } },
            { state: { contains: cleanQuery, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          level: true,
        },
        take: 20, // Guardrail pagination limits for mobile rendering
      }),

      // 2. Search Foods/Meals matching by name or description fields
      this.prisma.food.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: 'insensitive' } },
            { description: { contains: cleanQuery, mode: 'insensitive' } },
          ],
        },
        include: {
          vendor: {
            select: {
              name: true,
            },
          },
        },
        take: 30,
      }),
    ]);

    return {
      vendors,
      meals,
    };
  }
}
