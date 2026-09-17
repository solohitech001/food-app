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
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('flutterwave')
export class FlutterwaveController {
  constructor(
    private readonly flutterwaveService: FlutterwaveService,
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * =====================================
   * CREATE VIRTUAL ACCOUNT
   * =====================================
   * POST /flutterwave/virtual-account
   */
  @UseGuards(JwtAuthGuard)
  @Post('virtual-account')
  async createVirtualAccount(
    @Req() req: any,
    @Body()
    body: {
      bvn?: string;
      nin?: string;
    },
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestException('Invalid user');
    }

    // Get the complete user from the database
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.email) {
      throw new BadRequestException('User email is required');
    }

    if (!user.firstName || !user.lastName) {
      throw new BadRequestException(
        'First name and last name are required',
      );
    }

    if (!body.bvn && !body.nin) {
      throw new BadRequestException(
        'BVN or NIN is required to create a virtual account',
      );
    }

    // Prevent duplicate wallet creation
    const existingWallet = await this.walletService.findByUserId(userId);

    if (existingWallet) {
      return existingWallet;
    }

    const reference = `PLATTER-${userId}-${Date.now()}`;

    // Create permanent Flutterwave virtual account
    const account =
      await this.flutterwaveService.createVirtualAccount({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber ?? undefined,
        bvn: body.bvn,
        nin: body.nin,
        reference,
      });

    // Persist wallet
    return this.walletService.create({
      userId,
      virtualAccountNumber: account.account_number,
      virtualBankName: account.bank_name,
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
    // Verify webhook signature
    if (!this.flutterwaveService.verifySignature(signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const data =
      this.flutterwaveService.extractFundingData(payload);

    if (!data) {
      return {
        status: 'ignored',
      };
    }

    await this.walletService.handleFlutterwaveWebhook({
      reference: data.reference,
      accountNumber: data.accountNumber,
      amount: data.amount,
      currency: 'NGN',
    });

    return {
      status: 'success',
    };
  }
}
