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

    console.log('🔥 FLUTTERWAVE WEBHOOK:', JSON.stringify(payload, null, 2));

    // 2. Only process successful charge.completed events
    if (
      payload?.event !== 'charge.completed' ||
      payload?.data?.status !== 'successful'
    ) {
      return {
        status: 'ignored',
      };
    }

    // 3. Get transaction reference and amount
    //
    // Flutterwave sends our original wallet reference
    // as data.tx_ref
    const reference = payload?.data?.tx_ref;
    const amount = Number(payload?.data?.amount);
    const currency = payload?.data?.currency;

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

    console.log('💰 Funding reference:', reference);
    console.log('💰 Funding amount:', amount);

    // 4. Find wallet using Flutterwave tx_ref
    // and credit the wallet
    const result = await this.walletService.handleFlutterwaveWebhook({
      reference,
      amount,
      currency,
    });

    console.log('✅ Wallet credited:', result);

    return {
      status: 'success',
      ...result,
    };
  }
}
