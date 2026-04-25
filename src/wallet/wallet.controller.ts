import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  ParseFloatPipe,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TransactionService } from '../transaction/transaction.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private transactionService: TransactionService,
  ) {}

  /* ============================
     CREATE USER WALLET
  ============================ */
  @Post('create')
  async createWallet(@Req() req: any) {
    const userId = req.user.id; // from auth guard
    return this.walletService.createUserWallet(userId);
  }

  /* ============================
     CREATE VENDOR WALLET
  ============================ */
  @Post('create/vendor')
  async createVendorWallet(@Req() req: any) {
    const vendorId = req.user.vendorId;
    return this.walletService.createVendorWallet(vendorId);
  }

  /* ============================
     GET FULL WALLET
  ============================ */
  @Get('me')
  async getMyWallet(@Req() req: any) {
    const userId = req.user.id;
    return this.walletService.getMyWallet(userId);
  }

  /* ============================
     GET BALANCE ONLY
  ============================ */
  @Get('balance')
  async getBalance(@Req() req: any) {
    const userId = req.user.id;
    return this.walletService.getBalance(userId);
  }

  /* ============================
     TRANSFER TO VENDOR
  ============================ */
  @Post('transfer')
  async transfer(
    @Req() req: any,
    @Body()
    body: {
      vendorId: string;
      amount: number;
    },
  ) {
    const userId = req.user.id;

    return this.walletService.transferToVendor(
      userId,
      body.vendorId,
      body.amount,
    );
  }

  /* ============================
     WITHDRAW (VENDOR)
  ============================ */
  @Post('withdraw')
  async withdraw(
    @Req() req: any,
    @Body()
    body: {
      amount: number;
    },
  ) {
    const vendorId = req.user.vendorId;

    return this.walletService.withdraw(vendorId, body.amount);
  }

  /* ============================
     TRANSACTION HISTORY
  ============================ */
  @Get('transactions')
  async getTransactions(@Req() req: any) {
    const userId = req.user.id;
    return this.transactionService.getUserTransactions(userId);
  }

  /* ============================
     ADMIN / DEBUG
  ============================ */
  @Get(':walletId')
  async getWalletById(@Param('walletId') walletId: string) {
    return this.transactionService.getWalletTransactions(walletId);
  }
}