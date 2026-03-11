import { Module, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletWebhookController } from './wallet.webhook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { FlutterwaveModule } from '../fltterwave/flutterwave.module';

@Module({
  imports: [
    forwardRef(() => FlutterwaveModule), // ✅ FIX
  ],
  controllers: [WalletController, WalletWebhookController],
  providers: [WalletService, PrismaService],
  exports: [WalletService], // ✅ REQUIRED
})
export class WalletModule {}
