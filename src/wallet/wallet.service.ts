import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlutterwaveService } from '../fltterwave/flutterwave.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private flutterwave: FlutterwaveService,
  ) {}

  /* ============================
     CREATE USER WALLET
  ============================ */
  async createUserWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (existing) return existing;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.email) {
      throw new BadRequestException('User email is required');
    }

    const reference = `PLATTER-${userId}-${Date.now()}`;

    const flwAccount = await this.flutterwave.createVirtualAccount(
      user.email,
      reference,
    );

    return this.prisma.wallet.create({
      data: {
        userId,
        accountNumber: flwAccount.account_number,
        bankName: flwAccount.bank_name,
        flutterwaveRef: reference,
        balance: 0,
      },
    });
  }

  /* ============================
     CREATE VENDOR WALLET
  ============================ */
  async createVendorWallet(vendorId: string) {
    const existing = await this.prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (existing) return existing;

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true },
    });

    if (!vendor?.user?.email) {
      throw new BadRequestException('Vendor email is required');
    }

    const reference = `PLATTER-VENDOR-${vendorId}-${Date.now()}`;

    const flwAccount = await this.flutterwave.createVirtualAccount(
      vendor.user.email,
      reference,
    );

    return this.prisma.wallet.create({
      data: {
        vendorId,
        accountNumber: flwAccount.account_number,
        bankName: flwAccount.bank_name,
        flutterwaveRef: reference,
        balance: 0,
      },
    });
  }

  /* ============================
     GET WALLET
  ============================ */
  async getMyWallet(userId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        OR: [{ userId }, { vendor: { userId } }],
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    return wallet;
  }

  /* ============================
     GET BALANCE ONLY
  ============================ */
  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    return { balance: wallet.balance };
  }

  /* ============================
     CREDIT (INTERNAL USE)
  ============================ */
  async credit(walletId: string, amount: number, reference: string) {
    return this.prisma.$transaction(async (tx) => {
      const exists = await tx.transaction.findUnique({
        where: { reference },
      });

      if (exists) return;

      const updated = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId,
          amount,
          type: 'CREDIT',
          source: 'FLUTTERWAVE',
          reference,
          narration: 'Wallet funding',
        },
      });

      return updated;
    });
  }

  /* ============================
     DEBIT (INTERNAL USE)
  ============================ */
  async debit(walletId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.balance < amount) {
      throw new ForbiddenException('Insufficient balance');
    }

    return this.prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { decrement: amount } },
    });
  }

  /* ============================
     TRANSFER USER → VENDOR
  ============================ */
  async transferToVendor(userId: string, vendorId: string, amount: number) {
    const userWallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    const vendorWallet = await this.prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (!userWallet || !vendorWallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (userWallet.balance < amount) {
      throw new ForbiddenException('Insufficient balance');
    }

    const reference = `TX-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.wallet.update({
        where: { id: vendorWallet.id },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.createMany({
        data: [
          {
            walletId: userWallet.id,
            amount,
            type: 'DEBIT',
            source: 'TRANSFER',
            reference,
            narration: 'Payment to vendor',
          },
          {
            walletId: vendorWallet.id,
            amount,
            type: 'CREDIT',
            source: 'TRANSFER',
            reference,
            narration: 'Payment from customer',
          },
        ],
      });

      return { message: 'Transfer successful' };
    });
  }

  /* ============================
     WITHDRAW
  ============================ */
  async withdraw(vendorId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    if (wallet.balance < amount) {
      throw new ForbiddenException('Insufficient balance');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor?.accountNumber || !vendor.bankCode) {
      throw new BadRequestException('Vendor bank details missing');
    }

    const reference = `WD-${vendorId}-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      await this.flutterwave.initiateTransfer({
        amount,
        accountNumber: vendor.accountNumber!,
        bankCode: vendor.bankCode!,
        narration: 'Vendor withdrawal',
        reference,
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'DEBIT',
          source: 'WITHDRAWAL',
          reference,
          narration: 'Withdrawal to bank',
        },
      });

      return { message: 'Withdrawal successful' };
    });
  }

  /* ============================
     FLUTTERWAVE WEBHOOK CREDIT
  ============================ */
  async handleFlutterwaveWebhook(payload: {
    reference: string;
    accountNumber: string;
    amount: number;
    currency: string;
  }) {
    const { reference, accountNumber, amount, currency } = payload;

    if (currency !== 'NGN') {
      throw new BadRequestException('Invalid currency');
    }

    const exists = await this.prisma.webhookEvent.findUnique({
      where: { reference },
    });

    if (exists) return { duplicate: true };

    const wallet = await this.prisma.wallet.findUnique({
      where: { accountNumber },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT',
          source: 'FLUTTERWAVE',
          reference,
          narration: 'Wallet funding via Flutterwave',
        },
      });

      await tx.webhookEvent.create({
        data: {
          reference,
          source: 'FLUTTERWAVE',
        },
      });

      return { credited: true };
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.wallet.findFirst({ where: { userId } });
  }

  async create(data: {
    userId: string;
    accountNumber: string;
    bankName: string;
    flutterwaveRef: string;
  }) {
    return this.prisma.wallet.create({
      data: {
        ...data,
        balance: 0,
      },
    });
  }

  async creditWalletByAccountNumber(
    accountNumber: string,
    amount: number,
    reference: string,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { accountNumber },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 🔒 Idempotency check (VERY IMPORTANT)
      const exists = await tx.transaction.findUnique({
        where: { reference },
      });

      if (exists) return { duplicate: true };

      // 💰 Credit wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      // 🧾 Log transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT',
          source: 'FLUTTERWAVE',
          reference,
          narration: 'Wallet funded via Flutterwave',
        },
      });

      return { success: true };
    });
  }

  async creditWalletFromFlutterwave(
    accountNumber: string,
    amount: number,
    reference: string,
  ) {
    return this.handleFlutterwaveWebhook({
      reference,
      accountNumber,
      amount,
      currency: 'NGN',
    });
  }
}
