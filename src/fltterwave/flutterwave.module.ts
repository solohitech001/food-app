import { Module, forwardRef } from '@nestjs/common';
import { FlutterwaveService } from './flutterwave.service';
import { FlutterwaveController } from './flutterwave.controller';
import { WalletModule } from '../wallet/wallet.module';
import { WalletDepositModule } from 'src/wallet-deposit/wallet-deposit.module';

@Module({
  imports: [
    forwardRef(() => WalletModule), // ✅ REQUIRED
    forwardRef(() => WalletDepositModule), // ✅ REQUIRED

  ],
  controllers: [FlutterwaveController],
  providers: [FlutterwaveService],
  exports: [FlutterwaveService],
})
export class FlutterwaveModule {}
