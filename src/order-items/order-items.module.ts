import { Module } from '@nestjs/common';
import { OrdersService } from './order-items.service';
import { OrdersController } from './order-items.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
})
export class OrderItemsModule {}