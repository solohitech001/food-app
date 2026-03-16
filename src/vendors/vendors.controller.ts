import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/role.guard';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  /* USER APPLY VENDOR */
  @UseGuards(JwtAuthGuard)
  @Post('onboard')
  onboardVendor(@Req() req: any, @Body() body: any) {
    return this.vendorsService.createVendor(
      req.user.id,
      body.name,
    );
  }

  /* ============================
     VENDOR UPLOAD DOCUMENT
  ============================ */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post('documents')
  uploadVendorDocument(@Req() req: any, @Body() body: any) {
    return this.vendorsService.uploadVendorDocument(
      req.user.userId,
      body.type,     // NIN | PASSPORT | CAC
      body.fileUrl,  // uploaded file URL
    );
  }

  /* ============================
     ADMIN VIEW VENDOR DOCUMENTS
  ============================ */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/documents')
  getVendorDocuments(@Param('id') vendorId: string) {
    return this.vendorsService.getVendorDocuments(vendorId);
  }

  /* ============================
     ADMIN APPROVE VENDOR
  ============================ */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/approve')
  approveVendor(@Param('id') id: string) {
    return this.vendorsService.approveVendor(id);
  }

  /* ============================
     ADMIN REJECT VENDOR
  ============================ */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/reject')
  rejectVendor(@Param('id') id: string) {
    return this.vendorsService.rejectVendor(id);
  }

  /* ADMIN GET PENDING */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('pending')
  getPendingVendors() {
    return this.vendorsService.getPendingVendors();
  }
}
