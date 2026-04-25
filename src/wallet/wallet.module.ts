import { Module, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletWebhookController } from './wallet.webhook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { FlutterwaveModule } from '../fltterwave/flutterwave.module';
import { TransactionModule } from '../transaction/transaction.module'; // ✅ ADD

@Module({
  imports: [
    forwardRef(() => FlutterwaveModule), // ✅ existing
    forwardRef(() => TransactionModule), // ✅ FIXED (THIS SOLVES YOUR ERROR)
  ],
  controllers: [WalletController, WalletWebhookController],
  providers: [WalletService, PrismaService],
  exports: [WalletService],
})
export class WalletModule {}