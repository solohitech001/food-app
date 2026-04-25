import { Controller, Get, Param, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  // ✅ Get logged-in user transactions
  @Get('me')
  async getMyTransactions(@Req() req: any) {
    const userId = req.user.id; // assuming auth guard
    return this.transactionService.getUserTransactions(userId);
  }

  // ✅ Get by walletId (admin/debug)
  @Get('wallet/:walletId')
  async getWalletTransactions(@Param('walletId') walletId: string) {
    return this.transactionService.getWalletTransactions(walletId);
  }
}