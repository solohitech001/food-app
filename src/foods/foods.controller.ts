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

  @Get()
  getAllFoods() {
    return this.foodsService.getAllFoods();
  }

  @Get('feed')
  getFoodFeed(@Req() req: any) {
    return this.foodsService.getFoodFeed(req.user?.id);
  }

  /* =======================
     👤 VENDOR ROUTES
  ======================= */

  // Must be **before** the dynamic :id route
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Get('vendor')
  getVendorFoods(@Req() req: any) {
    console.log('Getting foods for vendor userId:', req.user.id); // Debug
    return this.foodsService.getVendorFoods(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Put(':id')
  updateFood(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    console.log('Updating food with id:', id, 'for user:', req.user.id);
    return this.foodsService.updateFood(id, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Delete(':id')
  deleteFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.deleteFood(id, req.user.id);
  }

  /* =======================
     🏪 VENDOR + ADMIN ROUTES
  ======================= */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR', 'ADMIN')
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'media', maxCount: 1 },
      ],
      { storage: memoryStorage() },
    ),
  )
  async createFood(
    @Req() req: any,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; media?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    if (!files.image || files.image.length === 0) {
      throw new BadRequestException('Food image is required');
    }

    if (!body.name || !body.price) {
      throw new BadRequestException('Name and price are required');
    }

    const userId = req.user.id;
    const imageFile = files.image[0];

    if (!imageFile.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files allowed');
    }

    const imageUrl = await this.storageService.uploadFile(
      imageFile,
      'foods/images/',
    );

    let mediaUrl: string | undefined;

    if (files.media && files.media.length > 0) {
      const videoFile = files.media[0];

      if (!videoFile.mimetype.startsWith('video/')) {
        throw new BadRequestException('Only video files allowed');
      }

      if (videoFile.size > 50 * 1024 * 1024) {
        throw new BadRequestException('Video too large (max 50MB)');
      }

      mediaUrl = await this.storageService.uploadFile(videoFile, 'foods/videos/');
    }

    return this.foodsService.createFood(userId, {
      name: body.name,
      description: body.description,
      price: Number(body.price),
      imageUrl,
      mediaUrl,
    });
  }

  /* =======================
     ❤️ LIKE / SAVE / SHARE
  ======================= */

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  likeFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.toggleLike(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  saveFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.toggleSave(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  shareFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.shareFood(id, req.user.id);
  }

  /* =======================
     🌍 PUBLIC DYNAMIC ROUTE
  ======================= */

  @Get(':id')
  getFoodById(@Param('id') id: string) {
    return this.foodsService.getFoodById(id);
  }
}