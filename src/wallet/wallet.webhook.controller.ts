import {
  Controller,
  Post,
  Headers,
  Body,
  ForbiddenException,
} from '@nestjs/common';
import { FlutterwaveService } from 'src/fltterwave/flutterwave.service';
import { WalletService } from './wallet.service';

@Controller('webhooks/flutterwave')
export class WalletWebhookController {
  constructor(
    private flutterwave: FlutterwaveService,
    private walletService: WalletService,
  ) {}

  @Post()
  async handleWebhook(
    @Headers('verif-hash') signature: string,
    @Body() payload: any,
  ) {
    // 🔒 1. Verify signature
    if (!this.flutterwave.verifySignature(signature)) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    const event = payload?.event;
    const data = payload?.data;

    // 🔍 2. Only process successful charges
    if (event !== 'charge.completed') {
      return { ignored: true, reason: 'Unhandled event' };
    }

    if (data?.status !== 'successful') {
      return { ignored: true, reason: 'Payment not successful' };
    }

    // 🛑 3. Validate payload
    if (
      !data?.account_number ||
      !data?.amount ||
      !data?.flw_ref ||
      !data?.currency
    ) {
      return { ignored: true, reason: 'Incomplete payload' };
    }

    // 💰 4. Credit wallet safely
    return this.walletService.handleFlutterwaveWebhook({
      accountNumber: data.account_number,
      amount: Number(data.amount),
      currency: data.currency,
      reference: data.flw_ref,
    });
  }
}