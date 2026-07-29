import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { DocumentType } from './dto/upload-vendor-document.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Express } from 'express';
import { OrderStatus, VendorLevel } from '@prisma/client';
import { PaymentSetupDto } from './dto/payment-setup.dto';
import { VerifyBankDto } from './dto/verify-bank.dto';
import axios from 'axios';
import { VendorOrderQueryDto } from './dto/vendor-order-query.dto';

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

  /* CREATE VENDOR (FULL ONBOARDING) */
  async createVendor(userId: string, dto: CreateVendorDto) {
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
        ...dto,
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

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { ...dto },
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

  /* ADMIN: FILTER BY STATUS */
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

  /* APPROVE DOCUMENT & UPGRADE ROLE */
  async approveDocument(documentId: string) {
    const doc = await this.prisma.vendorDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
    });

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: doc.vendorId },
      include: { user: true },
    });

    if (vendor?.userId) {
      await this.prisma.user.update({
        where: { id: vendor.userId },
        data: { role: 'VENDOR' },
      });
    }

    return doc;
  }

  async rejectDocument(documentId: string, comment?: string) {
    return this.prisma.vendorDocument.update({
      where: { id: documentId },
      data: { status: 'REJECTED', comment: comment || null },
    });
  }

  /* FETCH METRICS FOR VENDOR DASHBOARD */
  async getVendorMetrics(vendorId: string) {
    const [totalOrders, successful, cancelled, pending] =
      await this.prisma.$transaction([
        this.prisma.order.count({ where: { vendorId } }),
        this.prisma.order.count({
          where: { vendorId, status: 'COMPLETED' },
        }),
        this.prisma.order.count({
          where: { vendorId, status: 'CANCELLED' },
        }),
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
    const totalOrdersCount = await this.prisma.order.count({
      where: { userId },
    });

    const distinctVendorsAggregation = await this.prisma.order.groupBy({
      by: ['vendorId'],
      where: { userId },
    });

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
      vendors: distinctVendorsAggregation.length,
      meals: uniqueFoodIds.size,
    };
  }

  /* GET COMBINED DASHBOARD OVERVIEW FOR A USER */
  async getDashboardOverview(userId: string) {
    const activity = await this.getUserActivity(userId);

    let vendorMetrics = {
      totalOrders: 0,
      successful: 0,
      cancelled: 0,
      pending: 0,
    };

    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (vendor) {
      vendorMetrics = await this.getVendorMetrics(vendor.id);
    }

    return {
      vendorMetrics,
      activity,
    };
  }

  /* SEARCH MEALS AND VENDORS */
  async searchMarketplace(searchQuery?: string) {
    if (!searchQuery || !searchQuery.trim()) {
      return { vendors: [], meals: [] };
    }

    const cleanQuery = searchQuery.trim();

    const [vendors, meals] = await Promise.all([
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
        take: 20,
      }),

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

  async getVendorProfile(vendorId: string) {
    return this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        wallet: true,
        badges: true,
        reviews: true,
        foods: true,
        vendorDocuments: true,
      },
    });
  }

  async deleteVendor(vendorId: string) {
    return this.prisma.vendor.delete({
      where: { id: vendorId },
    });
  }

  async suspendVendor(vendorId: string) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'SUSPENDED' },
    });
  }

  async activateVendor(vendorId: string) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'ACTIVE' },
    });
  }

  async createNotification(vendorId: string, title: string, message: string) {
    return this.prisma.vendorNotification.create({
      data: {
        vendorId,
        title,
        message,
      },
    });
  }

  async getVendorByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: {
        wallet: true,
        badges: true,
        foods: true,
        reviews: true,
        vendorDocuments: true,
      },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor not found for this user');
    }

    return vendor;
  }

  async getNearbyVendors(city: string) {
    return this.prisma.vendor.findMany({
      where: {
        city,
        status: 'ACTIVE',
      },
      include: {
        foods: true,
      },
    });
  }

  async getTopRatedVendors() {
    return this.prisma.vendor.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { averageRating: 'desc' },
      take: 10,
    });
  }

  async getVendorFoods(vendorId: string) {
    return this.prisma.food.findMany({
      where: { vendorId },
    });
  }

  async getNotifications(vendorId: string) {
    return this.prisma.vendorNotification.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationAsRead(id: string) {
    return this.prisma.vendorNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async unreadNotificationCount(vendorId: string) {
    return this.prisma.vendorNotification.count({
      where: { vendorId, isRead: false },
    });
  }

  async deleteNotification(id: string) {
    return this.prisma.vendorNotification.delete({
      where: { id },
    });
  }

  async getVendorRevenue(vendorId: string) {
    const result = await this.prisma.order.aggregate({
      where: {
        vendorId,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
  }

  async getBestSellingFoods(vendorId: string) {
    return this.prisma.orderItem.groupBy({
      by: ['foodId'],
      where: { order: { vendorId } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });
  }

  async getVendorStats(vendorId: string) {
    const [foods, reviews, revenue, notifications] = await Promise.all([
      this.prisma.food.count({ where: { vendorId } }),
      this.prisma.review.count({ where: { vendorId } }),
      this.getVendorRevenue(vendorId),
      this.prisma.vendorNotification.count({
        where: { vendorId, isRead: false },
      }),
    ]);

    return {
      foods,
      reviews,
      revenue,
      unreadNotifications: notifications,
    };
  }

  async filterVendors(city?: string, state?: string, level?: VendorLevel) {
    return this.prisma.vendor.findMany({
      where: {
        city,
        state,
        level,
        status: 'ACTIVE',
      },
    });
  }

  async uploadCoverPhoto(vendorId: string, fileUrl: string) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { coverPhoto: fileUrl },
    });
  }

  async setupPayment(vendorId: string, dto: PaymentSetupDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor not found');
    }

    return this.prisma.vendor.update({
      where: {
        id: vendorId,
      },
      data: {
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        bankName: dto.bankName,
        bankCode: dto.bankCode,
      },
      select: {
        id: true,
        accountName: true,
        accountNumber: true,
        bankName: true,
        bankCode: true,
      },
    });
  }

  async verifyBank(dto: VerifyBankDto) {
    try {
      const response = await axios.post(
        'https://api.flutterwave.com/v3/accounts/resolve',
        {
          account_number: dto.accountNumber,
          account_bank: dto.bankCode,
        },
        {
          headers: {
            Authorization:
              `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` ||
              'FLWSECK-b09e764b7e44a276b65c07440f0a3b94-19d8e5acc14vt-X',
          },
        },
      );

      return {
        success: true,
        message: 'Bank account verified successfully',
        data: {
          accountName: response.data.data.account_name,
          accountNumber: response.data.data.account_number,
          bankCode: dto.bankCode,
          bankName: response.data.data.bank_name,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        error?.response?.data?.message ?? 'Unable to verify bank account',
      );
    }
  }

  async getVendorOrders(vendorId: string, query: VendorOrderQueryDto) {
    return this.prisma.order.findMany({
      where: {
        vendorId,
        ...(query.status && {
          status: query.status,
        }),
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
          },
        },

        items: {
          include: {
            food: true,
          },
        },

        review: true,
        escrow: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getVendorOrderDetails(vendorId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId,
      },
      include: {
        user: true,
        items: {
          include: {
            food: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return {
      success: true,
      message: 'Order retrieved successfully.',
      data: {
        id: order.id,
        reference: order.reference,
        amount: order.amount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        acceptBy: order.acceptBy,
        deliveredAt: order.deliveredAt,
        completedAt: order.completedAt,

        customer: {
          id: order.user.id,
          name: order.user.email, // Replace with fullName if you add one
          phoneNumber: order.user.phoneNumber,
        },

        items: order.items.map((item) => ({
          id: item.food.id,
          name: item.food.name,
          imageUrl: item.food.imageUrl,
          price: item.price,
          quantity: item.quantity,
        })),
      },
    };
  }

  async acceptOrder(vendorId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be accepted.');
    }

    await this.prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: OrderStatus.PREPARING,
      },
    });

    return {
      success: true,
      message: 'Order accepted successfully.',
    };
  }

  async startPreparing(vendorId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        vendorId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only accepted orders can be prepared.');
    }

    const updated = await this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: OrderStatus.PREPARING,
      },
    });

    return {
      success: true,
      message: 'Order is now being prepared.',
      data: updated,
    };
  }

  async markOrderReady(
  vendorId: string,
  orderId: string,
) {
  const order = await this.prisma.order.findFirst({
    where: {
      id: orderId,
      vendorId,
    },
  });

  if (!order) {
    throw new NotFoundException('Order not found.');
  }

  if (order.status !== OrderStatus.PREPARING) {
    throw new BadRequestException(
      'Only preparing orders can be marked as ready.',
    );
  }

  const updated = await this.prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: OrderStatus.READY,
    },
  });

  return {
    success: true,
    message: 'Order is ready for pickup.',
    data: updated,
  };
}

}
