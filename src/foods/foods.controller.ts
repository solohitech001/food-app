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
import {
  ApiConsumes,
  ApiBody,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { FoodsService } from './foods.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/role.guard';
import { ObjectStorageService } from 'src/uploads/object-storage';

// Import DTOs
import {
  CreateFoodDto,
  UpdateFoodDto,
  EmptyActionDto,
} from './dto/create-food.dto';
import { FoodFeedDto } from './dto/food-feed.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(
    private readonly foodsService: FoodsService,
    private readonly storageService: ObjectStorageService,
  ) {}

  /* ==========================================================================
     🌍 PUBLIC ROUTES
     ========================================================================== */

  @Get()
  @ApiOperation({ summary: 'Get all foods available' })
  getAllFoods() {
    return this.foodsService.getAllFoods();
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get location-filtered food feed for users' })
  @ApiResponse({ type: [FoodFeedDto] })
  getFoodFeed(@Req() req: any) {
    return this.foodsService.getFoodFeed(req.user?.id);
  }

  /* ==========================================================================
   🍽️ CATEGORY ROUTES
   ========================================================================== */

  @Get('categories')
  @ApiOperation({ summary: 'Get all meal categories' })
  getCategories() {
    return this.foodsService.getCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get a category with its subcategories' })
  getCategory(@Param('id') id: string) {
    return this.foodsService.getCategoryById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('categories')
  @ApiOperation({ summary: 'Create a new meal category' })
  createCategory(@Body() body: CreateCategoryDto) {
    return this.foodsService.createCategory(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a meal category' })
  updateCategory(@Param('id') id: string, @Body() body: CreateCategoryDto) {
    return this.foodsService.updateCategory(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a meal category' })
  deleteCategory(@Param('id') id: string) {
    return this.foodsService.deleteCategory(id);
  }

  /* ==========================================================================
     👤 VENDOR ROUTES
     ========================================================================== */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Get('vendor')
  @ApiOperation({
    summary: 'Get all foods belonging to the authenticated vendor',
  })
  getVendorFoods(@Req() req: any) {
    console.log('Getting foods for vendor userId:', req.user.id);
    return this.foodsService.getVendorFoods(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing food item' })
  @ApiBody({
    type: UpdateFoodDto,
    description: 'Payload structural keys for updating items',
  })
  updateFood(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: UpdateFoodDto,
  ) {
    console.log('Updating food with id:', id, 'for user:', req.user.id);
    return this.foodsService.updateFood(id, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a food item' })
  deleteFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.deleteFood(id, req.user.id);
  }

  /* ==========================================================================
     🏪 VENDOR + ADMIN ROUTES
     ========================================================================== */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR', 'ADMIN')
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateFoodDto })
  @ApiOperation({
    summary: 'Create a new food item with image and optional video',
  })
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
    @Body() body: CreateFoodDto,
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

      mediaUrl = await this.storageService.uploadFile(
        videoFile,
        'foods/videos/',
      );
    }

    return this.foodsService.createFood(userId, {
      name: body.name,
      description: body.description,
      price: Number(body.price),
      categoryId: body.categoryId,
      subTypeId: body.subTypeId,
      imageUrl,
      mediaUrl,
    });
  }

  /* ==========================================================================
     ❤️ LIKE / SAVE / SHARE
     ========================================================================== */

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @ApiBody({
    type: EmptyActionDto,
    description: 'Submit an empty object body: {}',
  })
  @ApiOperation({ summary: 'Toggle like state on a food item' })
  likeFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.toggleLike(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  @ApiBody({
    type: EmptyActionDto,
    description: 'Submit an empty object body: {}',
  })
  @ApiOperation({ summary: 'Toggle save state on a food item' })
  saveFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.toggleSave(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  @ApiBody({
    type: EmptyActionDto,
    description: 'Submit an empty object body: {}',
  })
  @ApiOperation({ summary: 'Log a share action for a food item' })
  shareFood(@Param('id') id: string, @Req() req: any) {
    return this.foodsService.shareFood(id, req.user.id);
  }

  /* ==========================================================================
     🌍 PUBLIC DYNAMIC ROUTE
     ========================================================================== */

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single food item by ID' })
  getFoodById(@Param('id') id: string) {
    return this.foodsService.getFoodById(id);
  }
}
