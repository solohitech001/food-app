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
    if (existingVendor)
      throw new BadRequestException('Vendor already exists');

    return this.prisma.vendor.create({
      data: {
        name,
        status: 'PENDING',
        user: { connect: { id: userId } },
      },
    });
  }

  /* UPDATE PROFILE */
  async updateVendorProfile(
    vendorId: string,
    dto: UpdateVendorProfileDto,
  ) {
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

  async approveDocument(documentId: string) {
    return this.prisma.vendorDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
    });
  }

  async rejectDocument(documentId: string, comment?: string) {
    return this.prisma.vendorDocument.update({
      where: { id: documentId },
      data: { status: 'REJECTED', comment: comment || null },
    });
  }
}





    