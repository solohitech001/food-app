import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from './orders.service';
import { EscrowService } from '../escrow/escrow.service';

@Injectable()
export class OrdersCron {
  private readonly logger = new Logger(OrdersCron.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly escrowService: EscrowService,
  ) {}

  /* ============================
     AUTO REFUND EXPIRED ORDERS
  ============================ */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredOrders() {
    try {
      const { refunded } = await this.ordersService.refundExpiredOrders();

      if (refunded > 0) {
        this.logger.log(`Auto-refunded ${refunded} expired orders`);
      }
    } catch (error) {
      this.logger.error('Error auto-refunding orders', error);
    }
  }

  /* ============================
     AUTO RELEASE DELIVERED ORDERS
  ============================ */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoRelease() {
    try {
      const orders =
        await this.ordersService.getDeliveredOrdersPendingRelease();

      for (const order of orders) {
        // 🔒 VERY IMPORTANT: check escrow exists
        if (!order.escrow) continue;

        // 🔒 Prevent double release
        if (order.escrow.status !== 'HELD') continue;

        await this.escrowService.release(order.id);

        await this.ordersService.completeOrderAuto(order.id);

        this.logger.log(`Auto-released order ${order.id}`);
      }
    } catch (error) {
      this.logger.error('Error auto-releasing orders', error);
    }
  }
}