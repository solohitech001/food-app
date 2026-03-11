import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  /* ============================
     HOLD FUNDS (ORDER CREATION)
     (Usually called internally)
  ============================ */
  @UseGuards(JwtAuthGuard)
  @Post('hold')
  holdFunds(
    @Body()
    body: {
      orderId: string;
      userWalletId: string;
      vendorWalletId: string;
      amount: number;
    },
  ) {
    return this.escrowService.holdFunds(
      body.orderId,
      body.userWalletId,
      body.vendorWalletId,
      body.amount,
    );
  }

  /* ============================
     RELEASE FUNDS TO VENDOR
     (Admin / System action)
  ============================ */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':orderId/release')
  release(@Param('orderId') orderId: string) {
    return this.escrowService.release(orderId);
  }

  /* ============================
     REFUND USER
     (Admin / Auto-timeout)
  ============================ */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':orderId/refund')
  refund(@Param('orderId') orderId: string) {
    return this.escrowService.refund(orderId);
  }
}
