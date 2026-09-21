import { Module } from '@nestjs/common';

import { WalletDepositController } from './wallet-deposit.controller';
import { WalletDepositService } from './wallet-deposit.service';
import { PrismaService } from '../prisma/prisma.service';
import { FlutterwaveModule } from '../fltterwave/flutterwave.module';

@Module({
  imports: [FlutterwaveModule],

  controllers: [WalletDepositController],

  providers: [WalletDepositService, PrismaService],

  exports: [WalletDepositService],
})
export class WalletDepositModule {}