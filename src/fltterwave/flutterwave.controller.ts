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
   * tx_ref  -> identifies the user's wallet
   * flw_ref -> identifies the individual payment
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

    const data = this.flutterwaveService.extractFundingData(payload);

    if (!data) {
      return {
        status: 'ignored',
      };
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
