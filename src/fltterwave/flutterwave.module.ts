import { Module, forwardRef } from '@nestjs/common';
import { FlutterwaveService } from './flutterwave.service';
import { FlutterwaveController } from './flutterwave.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    forwardRef(() => WalletModule), // ✅ REQUIRED
  ],
  controllers: [FlutterwaveController],
  providers: [FlutterwaveService],
  exports: [FlutterwaveService],
})
export class FlutterwaveModule {}
