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
   * Create Flutterwave virtual account for a user
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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    // Check if the user already has a wallet
    const existingWallet = await this.walletService.findByUserId(userId);

    if (existingWallet) {
      return existingWallet;
    }

    // This same reference is sent to Flutterwave as tx_ref
    // and stored in the wallet as flutterwaveRef.
    const reference = `PLATTER-${userId}-${Date.now()}`;

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

    return this.walletService.create({
      userId,
      virtualAccountNumber: account.account_number,
      virtualBankName: account.bank_name,
      flutterwaveRef: reference,
    });
  }

  /**
   * Flutterwave webhook
   *
   * Flutterwave sends the transaction reference as:
   * payload.data.tx_ref
   *
   * We use tx_ref to find the user's wallet.
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('verif-hash') signature: string,
    @Body() payload: any,
  ) {
    // Verify Flutterwave webhook signature
    if (!this.flutterwaveService.verifySignature(signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    console.log(
      '🔥 FLUTTERWAVE PAYLOAD:',
      JSON.stringify(payload, null, 2),
    );

    // Extract tx_ref and amount
    const data =
      this.flutterwaveService.extractFundingData(payload);

    // Ignore events that are not wallet funding transactions
    if (!data) {
      return {
        status: 'ignored',
      };
    }

    console.log('💰 Flutterwave funding data:', data);

    // Credit wallet using Flutterwave tx_ref
    const result =
      await this.walletService.handleFlutterwaveWebhook({
        reference: data.reference,
        amount: data.amount,
        currency: 'NGN',
      });

    console.log('✅ Wallet funding result:', result);

    return {
      status: 'success',
      ...result,
    };
  }
}