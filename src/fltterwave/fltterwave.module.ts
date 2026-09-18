import {
  Controller,
  Post,
  Headers,
  Body,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { FlutterwaveService } from './flutterwave.service';
import { WalletService } from '../wallet/wallet.service';

@Controller('webhooks/flutterwave')
export class FlutterwaveWebhookController {
  constructor(
    private readonly flutterwave: FlutterwaveService,
    private readonly walletService: WalletService,
  ) {}

  @Post()
  async handleWebhook(
    @Headers('verif-hash') signature: string,
    @Body() payload: any,
  ) {
    // 1. Verify Flutterwave signature
    if (!this.flutterwave.verifySignature(signature)) {
      throw new ForbiddenException('Invalid Flutterwave signature');
    }

    console.log(
      '🔥 FLUTTERWAVE WEBHOOK:',
      JSON.stringify(payload, null, 2),
    );

    // 2. Only process successful charge.completed events
    if (
      payload?.event !== 'charge.completed' ||
      payload?.data?.status !== 'successful'
    ) {
      return {
        status: 'ignored',
      };
    }

    // 3. Get wallet reference, transaction reference and amount
    //
    // tx_ref  = identifies the wallet
    // flw_ref = identifies this specific payment
    const walletReference = payload?.data?.tx_ref;
    const transactionReference = payload?.data?.flw_ref;
    const amount = Number(payload?.data?.amount);
    const currency = payload?.data?.currency;

    if (!walletReference) {
      throw new BadRequestException(
        'Flutterwave wallet reference (tx_ref) is missing',
      );
    }

    if (!transactionReference) {
      throw new BadRequestException(
        'Flutterwave transaction reference (flw_ref) is missing',
      );
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException(
        'Invalid Flutterwave transaction amount',
      );
    }

    if (currency !== 'NGN') {
      throw new BadRequestException(
        'Invalid Flutterwave currency',
      );
    }

    console.log(
      '💰 Wallet Reference (tx_ref):',
      walletReference,
    );

    console.log(
      '💰 Transaction Reference (flw_ref):',
      transactionReference,
    );

    console.log('💰 Funding amount:', amount);

    // 4. Find wallet using tx_ref
    // 5. Use flw_ref to prevent duplicate payment
    // 6. Credit wallet
    const result =
      await this.walletService.handleFlutterwaveWebhook({
        walletReference,
        transactionReference,
        amount,
        currency,
      });

    console.log('✅ Wallet funding result:', result);

    return {
      status: 'success',
      ...result,
    };
  }
}