import {
  Controller,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  Headers,
  Body,
} from '@nestjs/common';
import { FlutterwaveService } from './flutterwave.service';
import { WalletService } from '../wallet/wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('flutterwave')
export class FlutterwaveController {
  constructor(
    private readonly flutterwaveService: FlutterwaveService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * =====================================
   * CREATE VIRTUAL ACCOUNT
   * =====================================
   * POST /flutterwave/virtual-account
   */
  @UseGuards(JwtAuthGuard) 
  @Post('virtual-account')
  async createVirtualAccount(@Req() req) {
    const user = req.user;

    if (!user?.id) {
      throw new BadRequestException('Invalid user');
    }

    // 🔒 Prevent duplicate wallet creation
    const existingWallet = await this.walletService.findByUserId(user.id);
    if (existingWallet) {
      return existingWallet;
    }

    const email =
      user.email ?? `${user.phoneNumber}@platter.app`;

    const reference = `PLATTER-${user.id}-${Date.now()}`;

    // 🔥 Call Flutterwave API
    const account =
      await this.flutterwaveService.createVirtualAccount(
        email,
        reference,
      );

    // 💾 Persist wallet (matches Prisma schema)
    return this.walletService.create({
      userId: user.id,
      accountNumber: account.account_number,
      bankName: account.bank_name,
      flutterwaveRef: reference,
    });
  }

  /**
   * =====================================
   * FLUTTERWAVE WEBHOOK
   * =====================================
   * POST /flutterwave/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('verif-hash') signature: string,
    @Body() payload: any,
  ) {
    // 🔐 Verify webhook
    if (!this.flutterwaveService.verifySignature(signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const data = this.flutterwaveService.extractFundingData(payload);
    if (!data) {
      return { status: 'ignored' };
    }

    await this.walletService.creditWalletByAccountNumber(
      data.accountNumber,
      data.amount,
      data.reference,
    );

    return { status: 'success' };
  }
}
