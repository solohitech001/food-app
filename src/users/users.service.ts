import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /* ============================
     GET CURRENT USER PROFILE
  ============================ */
  async getMyProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendor: {
          include: {
            vendorDocuments: true, // ensure your Prisma schema has `vendorDocuments` relation
          },
        },
      },
    });

    if (!user) throw new BadRequestException('User not found');

    // Transform vendor documents if vendor exists
    const documents = user.vendor?.vendorDocuments.map(doc => ({
      id: doc.id,
      type: doc.type,
      fileUrl: doc.fileUrl,
      status: doc.status,
      comment: doc.comment,
      createdAt: doc.createdAt,
    }));

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      vendor: user.vendor
        ? {
            id: user.vendor.id,
            name: user.vendor.name,
            status: user.vendor.status,
            level: user.vendor.level,
            location: {
              city: user.vendor.city,
              state: user.vendor.state,
              latitude: user.vendor.latitude,
              longitude: user.vendor.longitude,
            },
          }
        : null,
      documents: documents || [],
    };
  }

  /* ============================
     UPDATE CURRENT USER PROFILE
  ============================ */
  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { ...dto },
    });
  }

  /* ============================
     GET ALL USERS (ADMIN)
  ============================ */
  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        vendor: { include: { vendorDocuments: true } },
      },
    });
  }

  /* ============================
     GET USER BY ID (ADMIN)
  ============================ */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendor: { include: { vendorDocuments: true } },
      },
    });
    if (!user) throw new BadRequestException('User not found');
    return user;
  }
}