import {
  Controller,
  Post,
  Headers,
  Body,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { FlutterwaveService } from 'src/fltterwave/flutterwave.service';
import { WalletService } from './wallet.service';

@Controller('webhooks/flutterwave')
export class WalletWebhookController {
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

    const event = payload?.event;
    const data = payload?.data;

    // 2. Only process successful charge.completed events
    if (event !== 'charge.completed') {
      return {
        status: 'ignored',
        reason: 'Unhandled event',
      };
    }

    if (data?.status !== 'successful') {
      return {
        status: 'ignored',
        reason: 'Payment not successful',
      };
    }

    // 3. Get both references from Flutterwave
    //
    // tx_ref  = identifies the wallet
    // flw_ref = identifies this specific payment
    const walletReference = data?.tx_ref;
    const transactionReference = data?.flw_ref;
    const amount = Number(data?.amount);
    const currency = data?.currency;

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

    console.log('💰 Wallet Reference (tx_ref):', walletReference);
    console.log(
      '💰 Transaction Reference (flw_ref):',
      transactionReference,
    );
    console.log('💰 Amount:', amount);
    console.log('💰 Currency:', currency);

    // 4. Find wallet using tx_ref
    // 5. Prevent duplicate payments using flw_ref
    // 6. Credit wallet
    return this.walletService.handleFlutterwaveWebhook({
      walletReference,
      transactionReference,
      amount,
      currency,
    });
  }
}
