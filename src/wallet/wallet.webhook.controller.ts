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
    // 1️⃣ Verify signature
    if (!this.flutterwave.verifySignature(signature)) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    const event = payload?.event;
    const data = payload?.data;

    // 2️⃣ Accept ONLY successful charges
    if (event !== 'charge.completed') {
      return { ignored: true, reason: 'Unhandled event' };
    }

    if (data.status !== 'successful') {
      return { ignored: true, reason: 'Payment not successful' };
    }

    // 3️⃣ Validate required fields
    if (
      !data.account_number ||
      !data.amount ||
      !data.flw_ref ||
      !data.currency
    ) {
      return { ignored: true, reason: 'Incomplete payload' };
    }

    // 4️⃣ Credit wallet safely
    return this.walletService.creditWalletFromWebhook({
      account_number: data.account_number,
      amount: Number(data.amount),
      currency: data.currency,
      reference: data.flw_ref,
    });
  }
}
