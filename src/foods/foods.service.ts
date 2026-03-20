import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocationService } from '../location/location.service';
import { FoodFeedDto } from './dto/food-feed.dto';

const PRICE_LIMITS: Record<'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3', number> = {
  LEVEL_1: 5000,
  LEVEL_2: 15000,
  LEVEL_3: 50000,
};

@Injectable()
export class FoodsService {
  constructor(
    private prisma: PrismaService,
    private locationService: LocationService,
  ) {}

  /* ===============================
     🔑 HELPER: GET VENDOR BY USER ID
  =============================== */
  private async getVendorByUser(userId: string) {
    console.log('Fetching vendor for userId:', userId); // Debug log
    if (!userId) {
      throw new BadRequestException('Invalid user');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { userId }, // userId in DB = req.user.id
    });

    if (!vendor) {
      throw new ForbiddenException('Vendor not found');
    }

    return vendor;
  }

  /* ===============================
     GET ALL FOODS
  =============================== */
  getAllFoods() {
    return this.prisma.food.findMany({
      include: { vendor: true },
    });
  }

  /* ===============================
     CREATE FOOD
  =============================== */
  async createFood(userId: string, data: any) {
    const vendor = await this.getVendorByUser(userId);

    if (vendor.status !== 'ACTIVE') {
      throw new ForbiddenException('Vendor not approved yet');
    }

    const maxPrice = PRICE_LIMITS[vendor.level];

    if (data.price > maxPrice) {
      throw new ForbiddenException(
        `Your vendor level allows a maximum price of ₦${maxPrice}`,
      );
    }

    return this.prisma.food.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        mediaUrl: data.mediaUrl,
        vendorId: vendor.id,
      },
    });
  }

  /* ===============================
     GET VENDOR FOODS
  =============================== */
 async getVendorFoods(userId: string) {
  console.log('Getting foods for userId:', userId); // Debug log
  const vendor = await this.getVendorByUser(userId);
  console.log('Vendor found:', vendor);

  const foods = await this.prisma.food.findMany({
    where: { vendorId: vendor.id },
  });
  console.log('Foods found:', foods);

  return foods;
}
  /* ===============================
     UPDATE FOOD
  =============================== */
  async updateFood(id: string, userId: string, data: any) {
    const vendor = await this.getVendorByUser(userId);

    const food = await this.prisma.food.findUnique({
      where: { id },
    });

    if (!food || food.vendorId !== vendor.id) {
      throw new ForbiddenException('Access denied');
    }

    // enforce price cap if updating price
    if (data.price !== undefined) {
      const maxPrice = PRICE_LIMITS[vendor.level];

      if (data.price > maxPrice) {
        throw new ForbiddenException(
          `Your vendor level allows a maximum price of ₦${maxPrice}`,
        );
      }
    }

    return this.prisma.food.update({
      where: { id },
      data,
    });
  }

  /* ===============================
     DELETE FOOD
  =============================== */
  async deleteFood(id: string, userId: string) {
    const vendor = await this.getVendorByUser(userId);

    const food = await this.prisma.food.findUnique({
      where: { id },
    });

    if (!food || food.vendorId !== vendor.id) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.food.delete({
      where: { id },
    });
  }

  /* ===============================
     GET SINGLE FOOD
  =============================== */
  async getFoodById(id: string) {
    return this.prisma.food.findUnique({
      where: { id },
      include: { vendor: true },
    });
  }

  /* ===============================
     SHARE FOOD
  =============================== */
  async shareFood(foodId: string, userId?: string) {
    await this.prisma.foodShare.create({
      data: { foodId, userId },
    });

    return { shared: true };
  }

  /* ===============================
     SAVE FOOD
  =============================== */
  async toggleSave(foodId: string, userId: string) {
    const existing = await this.prisma.foodSave.findUnique({
      where: {
        foodId_userId: { foodId, userId },
      },
    });

    if (existing) {
      await this.prisma.foodSave.delete({
        where: { id: existing.id },
      });
      return { saved: false };
    }

    await this.prisma.foodSave.create({
      data: { foodId, userId },
    });

    return { saved: true };
  }

  /* ===============================
     LIKE FOOD
  =============================== */
  async toggleLike(foodId: string, userId: string) {
    const existing = await this.prisma.foodLike.findUnique({
      where: {
        foodId_userId: { foodId, userId },
      },
    });

    if (existing) {
      await this.prisma.foodLike.delete({
        where: { id: existing.id },
      });
      return { liked: false };
    }

    await this.prisma.foodLike.create({
      data: { foodId, userId },
    });

    return { liked: true };
  }

  /* ===============================
     LOCATION LOCKED FOOD FEED
  =============================== */
  async getFoodFeed(userId?: string) {
    const foods = await this.prisma.food.findMany({
      include: {
        vendor: true,
        likes: true,
        saves: true,
        shares: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!userId) return foods;

    const filteredFoods: FoodFeedDto[] = [];

    for (const food of foods) {
      const canOrder = await this.locationService.canUserOrder(
        userId,
        food.vendorId,
      );

      if (!canOrder) continue;

      filteredFoods.push({
        id: food.id,
        title: food.name,
        description: food.description,
        image: food.imageUrl,
        video: food.mediaUrl,
        price: food.price,
        vendor: {
          id: food.vendor.id,
          name: food.vendor.name,
          handle: `@${food.vendor.name
            .toLowerCase()
            .replace(/\s+/g, '')}`,
        },
        stats: {
          likes: food.likes.length,
          saves: food.saves.length,
          shares: food.shares.length,
        },
        actions: {
          liked: food.likes.some((l) => l.userId === userId),
          saved: food.saves.some((s) => s.userId === userId),
          canShare: true,
        },
      });
    }

    return filteredFoods;
  }
}