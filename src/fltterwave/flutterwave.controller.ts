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

    const existingWallet =
      await this.walletService.findByUserId(userId);

    if (existingWallet) {
      return existingWallet;
    }

    // This becomes Flutterwave's tx_ref
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
   * tx_ref  -> identifies the user's wallet
   * flw_ref -> identifies the individual payment
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('verif-hash') signature: string,
    @Body() payload: any,
  ) {
    // Verify Flutterwave webhook signature
    if (!this.flutterwaveService.verifySignature(signature)) {
      throw new BadRequestException(
        'Invalid webhook signature',
      );
    }

    console.log(
      '🔥 FLUTTERWAVE PAYLOAD:',
      JSON.stringify(payload, null, 2),
    );

    // Only process successful completed payments
    if (
      payload?.event !== 'charge.completed' ||
      payload?.data?.status !== 'successful'
    ) {
      console.log(
        '⚠️ Ignoring Flutterwave event:',
        payload?.event,
        payload?.data?.status,
      );

      return {
        status: 'ignored',
      };
    }

    // Extract tx_ref, flw_ref and amount
    const data =
      this.flutterwaveService.extractFundingData(payload);

    if (!data) {
      return {
        status: 'ignored',
      };
    }

    console.log(
      '💰 Wallet Reference (tx_ref):',
      data.walletReference,
    );

    console.log(
      '💰 Transaction Reference (flw_ref):',
      data.transactionReference,
    );

    console.log(
      '💰 Funding Amount:',
      data.amount,
    );

    // tx_ref     -> finds the wallet
    // flw_ref    -> identifies this specific payment
    const result =
      await this.walletService.handleFlutterwaveWebhook({
        walletReference: data.walletReference,
        transactionReference: data.transactionReference,
        amount: data.amount,
        currency: 'NGN',
      });

    console.log(
      '✅ Wallet funding result:',
      result,
    );

    return {
      status: 'success',
      ...result,
    };
  }
}