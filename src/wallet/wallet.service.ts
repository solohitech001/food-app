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
     CREATE USER WALLET (REAL)
  ============================ */
  async createUserWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.email) {
      throw new BadRequestException('User email is required');
    }

    const flwAccount = await this.flutterwave.createVirtualAccount(
      user.email,
      'Platter User Wallet',
    );

    return this.prisma.wallet.create({
      data: {
        userId,
        accountNumber: flwAccount.account_number,
        bankName: flwAccount.bank_name,
        flutterwaveRef: flwAccount.order_ref,
      },
    });
  }

  /* ============================
     CREATE VENDOR WALLET (REAL)
  ============================ */
  async createVendorWallet(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true },
    });

    if (!vendor?.user?.email) {
      throw new BadRequestException('Vendor email is required');
    }

    const flwAccount = await this.flutterwave.createVirtualAccount(
      vendor.user.email,
      vendor.name,
    );

    return this.prisma.wallet.create({
      data: {
        vendorId,
        accountNumber: flwAccount.account_number,
        bankName: flwAccount.bank_name,
        flutterwaveRef: flwAccount.order_ref,
      },
    });
  }

  /* ============================
     GET MY WALLET
  ============================ */
  async getMyWallet(userId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        OR: [{ userId }, { vendor: { userId } }],
      },
      include: { transactions: true },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    return wallet;
  }

  /* ============================
     USER → VENDOR TRANSFER
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
            reference: `TX-${Date.now()}`,
            narration: 'Payment to vendor',
          },
          {
            walletId: vendorWallet.id,
            amount,
            type: 'CREDIT',
            source: 'TRANSFER',
            reference: `TX-${Date.now()}`,
            narration: 'Payment from customer',
          },
        ],
      });

      return { message: 'Transfer successful' };
    });
  }

  /* ============================
     VENDOR WITHDRAW (LIMITED)
  ============================ */
  async withdraw(vendorId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    if (wallet.withdrawalsThisMonth >= 2) {
      throw new ForbiddenException('Monthly withdrawal limit reached');
    }

    if (wallet.balance < amount) {
      throw new ForbiddenException('Insufficient balance');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          withdrawalsThisMonth: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'DEBIT',
          source: 'WITHDRAWAL',
          reference: `WD-${Date.now()}`,
          narration: 'Vendor withdrawal',
        },
      });

      return { message: 'Withdrawal successful' };
    });
  }

  async creditWalletFromFlutterwave(
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
      // Credit wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      // Create transaction record
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

      return { message: 'Wallet credited successfully' };
    });
  }

  async creditWalletFromWebhook(data: {
    account_number: string;
    amount: number;
    currency: string;
    reference: string;
  }) {
    const { account_number, amount, currency, reference } = data;

    if (currency !== 'NGN') {
      throw new BadRequestException('Invalid currency');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { accountNumber: account_number },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    // ✅ Idempotency check
    const existingTx = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (existingTx) {
      return { ignored: true, reason: 'Duplicate webhook' };
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

      return { credited: true };
    });
  }

  async processFlutterwaveFunding(payload: {
    reference: string;
    accountNumber: string;
    amount: number;
    currency: string;
  }) {
    const { reference, accountNumber, amount, currency } = payload;

    // 1️⃣ Idempotency check
    const exists = await this.prisma.webhookEvent.findUnique({
      where: { reference },
    });

    if (exists) {
      return { duplicate: true };
    }

    // 2️⃣ Currency validation
    if (currency !== 'NGN') {
      throw new BadRequestException('Invalid currency');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { accountNumber },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    // 3️⃣ Atomic credit
    await this.prisma.$transaction(async (tx) => {
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
    });

    return { credited: true };
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
        userId: data.userId,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        flutterwaveRef: data.flutterwaveRef,
        balance: 0,
      },
    });
  }

  async creditWalletByAccountNumber(
    accountNumber: string,
    amount: number,
    reference: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { accountNumber },
      });

      if (!wallet) return;

      // ⛔ prevent duplicate credits
      const exists = await tx.transaction.findUnique({
        where: { reference },
      });

      if (exists) return;

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
          narration: 'Wallet funding',
        },
      });
    });
  }
}
