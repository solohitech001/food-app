import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyWallet(@Req() req: any) {
    return this.walletService.getMyWallet(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  transferToVendor(
    @Req() req: any,
    @Body('vendorId') vendorId: string,
    @Body('amount') amount: number,
  ) {
    return this.walletService.transferToVendor(
      req.user.userId,
      vendorId,
      amount,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post('withdraw')
  withdraw(@Req() req: any, @Body('amount') amount: number) {
    return this.walletService.withdraw(req.user.userId, amount);
  }
}
