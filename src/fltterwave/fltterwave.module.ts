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
      throw new ForbiddenException('Invalid Flutterwave signature');
    }

    // 2️⃣ Only handle successful credit events
    if (
      payload.event !== 'charge.completed' ||
      payload.data?.status !== 'successful'
    ) {
      return { ignored: true };
    }

    const accountNumber = payload.data?.meta?.virtual_account_number;
    const amount = Number(payload.data?.amount);
    const reference = payload.data?.tx_ref;

    if (!accountNumber || !amount || !reference) {
      throw new BadRequestException('Invalid webhook payload');
    }

    // 3️⃣ Credit wallet + record transaction
    await this.walletService.creditWalletFromFlutterwave(
      accountNumber,
      amount,
      reference,
    );

    return { received: true };
  }
}
