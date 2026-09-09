import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import { WalletService } from './wallet.service';
import { TransactionService } from '../transaction/transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private transactionService: TransactionService,
    private prisma: PrismaService,
  ) {}

  /* ============================
     CREATE USER WALLET
  ============================ */
  @Post('create')
  async createWallet(@Req() req: any) {
    const userId = req.user.id;

    return this.walletService.createUserWallet(userId);
  }

  /* ============================
     CREATE VENDOR WALLET
  ============================ */
  @Post('create/vendor')
  async createVendorWallet(@Req() req: any) {
    console.log('Creating vendor wallet for user:', req.user);

    const userId = req.user.id;

    const vendor = await this.prisma.vendor.findUnique({
      where: {
        userId,
      },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor profile not found');
    }

    console.log('Found vendor:', vendor.id);

    return this.walletService.createVendorWallet(vendor.id);
  }

  /* ============================
     GET FULL WALLET
  ============================ */
  @Get('me')
  async getMyWallet(@Req() req: any) {
    return this.walletService.getMyWallet(req.user.id);
  }

  /* ============================
     GET BALANCE ONLY
  ============================ */
  @Get('balance')
  async getBalance(@Req() req: any) {
    return this.walletService.getBalance(req.user.id);
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
    return this.walletService.transferToVendor(
      req.user.id,
      body.vendorId,
      body.amount,
    );
  }

  /* ============================
     WITHDRAW
  ============================ */
  @Post('withdraw')
  async withdraw(
    @Req() req: any,
    @Body()
    body: {
      amount: number;
    },
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor profile not found');
    }

    return this.walletService.withdraw(
      vendor.id,
      body.amount,
    );
  }

  /* ============================
     TRANSACTION HISTORY
  ============================ */
  @Get('transactions')
  async getTransactions(@Req() req: any) {
    return this.transactionService.getUserTransactions(
      req.user.id,
    );
  }

  /* ============================
     ADMIN / DEBUG
  ============================ */
  @Get(':walletId')
  async getWalletById(
    @Param('walletId') walletId: string,
  ) {
    return this.transactionService.getWalletTransactions(
      walletId,
    );
  }
}