import {
  Controller,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  Headers,
  Body,
} from '@nestjs/common';
import { WalletDepositService } from 'src/wallet-deposit/wallet-deposit.service';
import { FlutterwaveService } from './flutterwave.service';
import { WalletService } from '../wallet/wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('flutterwave')
export class FlutterwaveController {
  constructor(
    private readonly flutterwaveService: FlutterwaveService,
    private readonly walletService: WalletService,
    private readonly walletDepositService: WalletDepositService,
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
      throw new BadRequestException('First name and last name are required');
    }

    if (!body.bvn && !body.nin) {
      throw new BadRequestException(
        'BVN or NIN is required to create a virtual account',
      );
    }

    const existingWallet = await this.walletService.findByUserId(userId);

    if (existingWallet) {
      return existingWallet;
    }

    // This becomes Flutterwave's tx_ref
    const reference = `PLATTER-${userId}-${Date.now()}`;

    const account = await this.flutterwaveService.createVirtualAccount({
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
   * Supports both:
   * - New format: { event: 'charge.completed', data: { status, tx_ref, ... } }
   * - Legacy/USSD format: { status, txRef, amount, ... }
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('verif-hash') signature: string,
    @Body() payload: any,
  ) {
    if (!this.flutterwaveService.verifySignature(signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    console.log('🔥  FLUTTERWAVE PAYLOAD:', JSON.stringify(payload, null, 2));

    // ----- Normalize different Flutterwave payload shapes -----
    const event = payload?.event ?? payload?.['event.type'] ?? null;
    const status =
      payload?.data?.status ??
      payload?.status ??
      null;

    const txRef =
      payload?.data?.tx_ref ??
      payload?.data?.txRef ??
      payload?.txRef ??
      payload?.tx_ref ??
      null;

    const flwRef =
      payload?.data?.flw_ref ??
      payload?.data?.flwRef ??
      payload?.flwRef ??
      payload?.flw_ref ??
      null;

    const amount =
      payload?.data?.amount ??
      payload?.amount ??
      null;

    console.log('📌 Normalized →', { event, status, txRef, flwRef, amount });

    // Only process successful payments
    const isSuccessful =
      status === 'successful' || status === 'SUCCESSFUL';

    // Accept charge.completed OR successful USSD / card payments that carry a txRef
    const shouldProcess =
      isSuccessful &&
      txRef &&
      (event === 'charge.completed' ||
        event === 'USSD_TRANSACTION' ||
        event === 'CARD_TRANSACTION' ||
        !event); // some payloads have no event field

    if (!shouldProcess) {
      console.log('⚠️ Ignoring Flutterwave event:', event, status);
      return { status: 'ignored' };
    }

    // Prefer the service extractor if it works, otherwise fall back to normalized values
    let data = this.flutterwaveService.extractFundingData(payload);

    if (!data) {
      // Fallback for the legacy shape you are currently receiving
      data = {
        walletReference: txRef,
        transactionReference: flwRef ?? txRef,
        amount: Number(amount),
      };
    }

    if (!data?.walletReference) {
      console.log('⚠️ Could not extract wallet reference from payload');
      return { status: 'ignored' };
    }

    console.log('💰 Wallet Deposit Reference:', data.walletReference);
    console.log('💰 Flutterwave Transaction:', data.transactionReference);
    console.log('💰 Payment Amount:', data.amount);

    const result = await this.walletDepositService.completeDeposit(
      data.walletReference,
      data.transactionReference,
    );

    console.log('✅ Wallet deposit result:', result);

    return result;
  }
}