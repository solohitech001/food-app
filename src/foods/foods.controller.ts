import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { FoodsService } from './foods.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/role.guard';
import { ObjectStorageService } from 'src/uploads/object-storage';

@Controller('foods')
export class FoodsController {
  constructor(
    private readonly foodsService: FoodsService,
    private readonly storageService: ObjectStorageService,
  ) {}

  /* =======================
     🌍 PUBLIC ROUTES
     ======================= */

  // Get all foods (admin / testing / fallback)
  @Get()
  getAllFoods() {
    return this.foodsService.getAllFoods();
  }

  // TikTok-style feed (personalized if logged in)
  @Get('feed')
  getFoodFeed(@Req() req: any) {
    return this.foodsService.getFoodFeed(req.user?.userId);
  }

  // Get single food by ID
  @Get(':id')
  getFoodById(@Param('id') id: string) {
    return this.foodsService.getFoodById(id);
  }

  /* =======================
     ❤️ LIKE / SAVE / SHARE
     ======================= */

  // Like / Unlike food
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  likeFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.toggleLike(id, req.user.userId);
  }

  // Save / Unsave food
  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  saveFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.toggleSave(id, req.user.userId);
  }

  // Share food (public or logged in)
  @Post(':id/share')
  shareFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.shareFood(id, req.user?.userId);
  }

  /* =======================
     🏪 VENDOR ROUTES
     ======================= */

  // Vendor create food (image required, video optional)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'media', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
      },
    ),
  )
  async createFood(
    @Req() req: any,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      media?: Express.Multer.File[];
    },
    @Body() body: any,
  ) {
    if (!files.image || files.image.length === 0) {
      throw new BadRequestException('Food image is required');
    }

    if (!body.name || !body.price) {
      throw new BadRequestException('Name and price are required');
    }

    const userId = req.user.userId;

    // Upload image
    const imageUrl = await this.storageService.uploadFile(
      files.image[0],
      'foods/images/',
    );

    // Upload optional video
    let mediaUrl: string | undefined;
    if (files.media && files.media.length > 0) {
      mediaUrl = await this.storageService.uploadFile(
        files.media[0],
        'foods/videos/',
      );
    }

    return this.foodsService.createFood(userId, {
      name: body.name,
      description: body.description,
      price: Number(body.price),
      imageUrl,
      mediaUrl,
    });
  }

  // Vendor – get own foods
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Get('vendor')
  getVendorFoods(@Req() req: any) {
    return this.foodsService.getVendorFoods(req.user.userId);
  }

  // Vendor – update food
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Put(':id')
  updateFood(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.foodsService.updateFood(id, req.user.userId, body);
  }

  // Vendor – delete food
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Delete(':id')
  deleteFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.deleteFood(id, req.user.userId);
  }
}
