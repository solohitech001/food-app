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
      throw new ForbiddenException('Invalid webhook signature');
    }

    console.log('🔥 FLUTTERWAVE WEBHOOK:', JSON.stringify(payload, null, 2));

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

    // 3. Get our wallet reference from Flutterwave tx_ref
    const reference = data?.tx_ref;
    const amount = Number(data?.amount);
    const currency = data?.currency;

    if (!reference) {
      throw new BadRequestException(
        'Flutterwave transaction reference is missing',
      );
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid Flutterwave transaction amount');
    }

    if (currency !== 'NGN') {
      throw new BadRequestException('Invalid Flutterwave currency');
    }

    console.log('💰 Reference:', reference);
    console.log('💰 Amount:', amount);
    console.log('💰 Currency:', currency);

    // 4. Credit wallet using tx_ref
    return this.walletService.handleFlutterwaveWebhook({
      reference,
      amount,
      currency,
    });
  }
}
