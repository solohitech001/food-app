import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersCron } from './orders.cron';

import { PrismaModule } from '../prisma/prisma.module';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [
    PrismaModule,   // 🔥 needed for DB
    EscrowModule,   // 🔥 needed for escrow service
  ],
  providers: [
    OrdersService,
    OrdersCron,     // 🔥 THIS ENABLES CRON
  ],
  controllers: [OrdersController],
})
export class OrdersModule {}