import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';
import { FoodsModule } from './foods/foods.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { LocationModule } from './location/location.module';
import { WalletModule } from './wallet/wallet.module';
import { FlutterwaveModule } from './fltterwave/flutterwave.module';
import { UploadsModule } from './uploads/uploads.module';
import { EscrowModule } from './escrow/escrow.module';
import { AfricasTalkingModule } from './africastalking/africastalking.module';

import { AfricastalkingVoiceService } from './africastalking-voice/africastalking-voice.service';
import { OrderItemsModule } from './order-items/order-items.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // 🔥 VERY IMPORTANT (enables cron)

    AuthModule,
    UsersModule,
    VendorsModule,
    FoodsModule,
    OrdersModule,
    PrismaModule,
    LocationModule,
    WalletModule,
    FlutterwaveModule,
    UploadsModule,
    EscrowModule,
    AfricasTalkingModule,
    OrderItemsModule,
    TransactionModule
  ],
  controllers: [AppController],
  providers: [AppService, AfricastalkingVoiceService],
})
export class AppModule {}