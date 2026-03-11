import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  /* USER → APPLY VENDOR */
  async createVendor(userId: string, name: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new BadRequestException('User not found');

    if (!user.isVerified) {
      throw new BadRequestException('Verify your account first');
    }

    const existingVendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (existingVendor) {
      throw new BadRequestException('Vendor already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          name,
          userId,
          status: 'PENDING',
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: 'VENDOR' },
      });

      return {
        message: 'Vendor application submitted. Upload documents for review.',
        vendor,
      };
    });
  }

  /* ============================
     VENDOR UPLOAD DOCUMENT
  ============================ */
  async uploadVendorDocument(
    userId: string,
    type: 'NIN' | 'PASSPORT' | 'CAC' | 'BUSINESS_LICENSE',
    fileUrl: string,
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new ForbiddenException('Vendor not found');
    }

    const document = await this.prisma.vendorDocument.create({
      data: {
        vendorId: vendor.id,
        type,
        fileUrl,
        status: 'PENDING',
      },
    });

    // Move vendor to UNDER_REVIEW
    if (vendor.status === 'PENDING') {
      await this.prisma.vendor.update({
        where: { id: vendor.id },
        data: { status: 'UNDER_REVIEW' },
      });
    }

    return {
      message: 'Document uploaded successfully. Await admin review.',
      document,
    };
  }

  /* ============================
     ADMIN VIEW VENDOR DOCUMENTS
  ============================ */
  async getVendorDocuments(vendorId: string) {
    return this.prisma.vendorDocument.findMany({
      where: { vendorId },
    });
  }

  /* ============================
     ADMIN APPROVE VENDOR
  ============================ */
  async approveVendor(vendorId: string) {
    const documents = await this.prisma.vendorDocument.findMany({
      where: { vendorId },
    });

    if (documents.length === 0) {
      throw new BadRequestException('No documents uploaded');
    }

    const unapproved = documents.some((doc) => doc.status !== 'APPROVED');

    if (unapproved) {
      throw new BadRequestException('All documents must be approved first');
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'ACTIVE' },
    });
  }

  /* ============================
     ADMIN REJECT VENDOR
  ============================ */
  async rejectVendor(vendorId: string) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'REJECTED' },
    });
  }

  /* ENSURE VENDOR IS ACTIVE */
  async ensureActiveVendor(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) throw new ForbiddenException('Vendor not found');

    if (vendor.status !== 'ACTIVE') {
      throw new ForbiddenException('Vendor not approved yet');
    }

    return vendor;
  }

  /* ADMIN → LIST PENDING / UNDER REVIEW */
  async getPendingVendors() {
    return this.prisma.vendor.findMany({
      where: {
        status: {
          in: ['PENDING', 'UNDER_REVIEW'],
        },
      },
      include: { user: true },
    });
  }

  async updateVendorLocation(userId, data) {
    return this.prisma.vendor.update({
      where: { userId },
      data,
    });
  }

  async recalculateVendorLevel(vendorId: string) {
    const completedOrders = await this.prisma.order.count({
      where: {
        vendorId,
        status: 'DELIVERED',
      },
    });

    let level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' = 'LEVEL_1';

    if (completedOrders >= 100) level = 'LEVEL_3';
    else if (completedOrders >= 30) level = 'LEVEL_2';

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { level },
    });
  }
}
