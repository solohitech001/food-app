// src/vendors/vendors.controller.ts
import {
  Controller,
  Post,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Body,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { VendorsService } from './vendors.service';

import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { UploadVendorDocumentDto } from './dto/upload-vendor-document.dto';
import { GetVendorsDto } from './dto/get-vendors.dto';
import { ApproveRejectVendorDto } from './dto/ApproveRejectDocumentDto';

@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  /* CREATE */
  @UseGuards(JwtAuthGuard)
  @Post('onboard')
  createVendor(@Req() req, @Body() dto: CreateVendorDto) {
    return this.vendorsService.createVendor(req.user.id, dto.name);
  }

  /* UPDATE */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post(':id/profile')
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateVendorProfileDto,
  ) {
    return this.vendorsService.updateVendorProfile(id, dto);
  }

  /* UPLOAD */
  @UseGuards(JwtAuthGuard)
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadVendorDocumentDto,
  ) {
    return this.vendorsService.uploadVendorDocument(id, dto.type, file);
  }

  /* ADMIN */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('all')
  getAll(@Query() query: GetVendorsDto) {
    if (query.status) {
      return this.vendorsService.getVendorsByStatus(query.status);
    }
    return this.vendorsService.getAllVendors();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get(':id/documents')
getVendorDocuments(@Param('id') vendorId: string) {
  return this.vendorsService.getVendorDocuments(vendorId);
}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('documents/:id/approve')
  approve(@Param('id') id: string) {
    return this.vendorsService.approveDocument(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('documents/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: ApproveRejectVendorDto,
  ) {
    return this.vendorsService.rejectDocument(id, dto.comment);
  }
}