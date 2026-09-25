import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
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

  async createUserWallet(
    userId: string,
    kyc: {
      bvn?: string;
      nin?: string;
    },
  ) {
    const existing = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.email) {
      throw new BadRequestException('User email is required');
    }

    if (!user.firstName || !user.lastName) {
      throw new BadRequestException('First name and last name are required');
    }

    if (!kyc.bvn && !kyc.nin) {
      throw new BadRequestException(
        'BVN or NIN is required to create a virtual account',
      );
    }

    const reference = `PLATTER-${userId}-${Date.now()}`;

    const flwAccount = await this.flutterwave.createVirtualAccount({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber ?? undefined,
      bvn: kyc.bvn,
      nin: kyc.nin,
      reference,
    });

    return this.prisma.wallet.create({
      data: {
        userId,
        virtualAccountNumber: flwAccount.account_number,
        virtualBankName: flwAccount.bank_name,
        flutterwaveRef: reference,
        balance: 0,
      },
    });
  }

  /* ============================
     CREATE VENDOR WALLET
  ============================ */
  async createVendorWallet(
    vendorId: string,
    kyc: {
      bvn?: string;
      nin?: string;
    },
  ) {
    const existing = await this.prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (existing) {
      return existing;
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true },
    });

    if (!vendor?.user?.email) {
      throw new BadRequestException('Vendor email is required');
    }

    if (!vendor.user.firstName || !vendor.user.lastName) {
      throw new BadRequestException(
        'Vendor first name and last name are required',
      );
    }

    if (!kyc.bvn && !kyc.nin) {
      throw new BadRequestException(
        'BVN or NIN is required   create a virtual account',
      );
    }

    const reference = `PLATTER-VENDOR-${vendorId}-${Date.now()}`;

    const flwAccount = await this.flutterwave.createVirtualAccount({
      email: vendor.user.email,
      firstName: vendor.user.firstName,
      lastName: vendor.user.lastName,
      phoneNumber: vendor.user.phoneNumber ?? undefined,
      bvn: kyc.bvn,
      nin: kyc.nin,
      reference,
    });

    return this.prisma.wallet.create({
      data: {
        vendorId,
        virtualAccountNumber: flwAccount.account_number,
        virtualBankName: flwAccount.bank_name,
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

      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const newBalance = Number(wallet.balance) + amount;

      const updated = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: amount },
        },
      });

      await tx.transaction.create({
        data: {
          walletId,
          amount,
          type: 'CREDIT',
          source: 'FLUTTERWAVE',
          reference,
          narration: 'Wallet funding',
          balanceAfter: newBalance,
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

    if (!wallet || Number(wallet.balance) < amount) {
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

    if (Number(userWallet.balance) < amount) {
      throw new ForbiddenException('Insufficient balance');
    }

    const reference = `TX-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const userNewBalance = Number(userWallet.balance) - amount;
      const vendorNewBalance = Number(vendorWallet.balance) + amount;

      await tx.wallet.update({
        where: { id: userWallet.id },
        data: {
          balance: { decrement: amount },
        },
      });

      await tx.wallet.update({
        where: { id: vendorWallet.id },
        data: {
          balance: { increment: amount },
        },
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
            balanceAfter: userNewBalance,
          },
          {
            walletId: vendorWallet.id,
            amount,
            type: 'CREDIT',
            source: 'TRANSFER',
            reference,
            narration: 'Payment from customer',
            balanceAfter: vendorNewBalance,
          },
        ],
      });

      return {
        message: 'Transfer successful',
      };
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

    if (Number(wallet.balance) < amount) {
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
          balanceAfter: Number(wallet.balance) - amount,
        },
      });

      return { message: 'Withdrawal successful' };
    });
  }

  /* ============================
     FLUTTERWAVE WEBHOOK CREDIT
  ============================ */
  /* ============================
   FLUTTERWAVE WEBHOOK CREDIT
============================ */

  async handleFlutterwaveWebhook(payload: {
    walletReference: string;
    transactionReference: string;
    amount: number;
    currency: string;
  }) {
    const { walletReference, transactionReference, amount, currency } = payload;

    if (currency !== 'NGN') {
      throw new BadRequestException('Invalid currency');
    }

    if (!walletReference) {
      throw new BadRequestException('Flutterwave wallet reference is missing');
    }

    if (!transactionReference) {
      throw new BadRequestException(
        'Flutterwave transaction reference is missing',
      );
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid Flutterwave transaction amount');
    }

    // Find wallet using tx_ref
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        flutterwaveRef: walletReference,
      },
    });

    if (!wallet) {
      throw new BadRequestException(
        `Wallet not found for Flutterwave reference: ${walletReference}`,
      );
    }

    // Prevent the same individual Flutterwave payment
    // from crediting the wallet twice.
    const exists = await this.prisma.webhookEvent.findUnique({
      where: {
        reference: transactionReference,
      },
    });

    if (exists) {
      return {
        duplicate: true,
        message: 'Flutterwave transaction already processed',
      };
    }

    return this.prisma.$transaction(async (tx) => {
      // Double-check inside the transaction
      const existingTransaction = await tx.transaction.findUnique({
        where: {
          reference: transactionReference,
        },
      });

      if (existingTransaction) {
        return {
          duplicate: true,
          message: 'Flutterwave transaction already processed',
        };
      }

      // Credit wallet
      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // Record individual Flutterwave transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT',
          source: 'FLUTTERWAVE',
          reference: transactionReference,
          narration: 'Wallet funding via Flutterwave',
          balanceAfter: updatedWallet.balance,
        },
      });

      // Record webhook/payment reference
      await tx.webhookEvent.create({
        data: {
          reference: transactionReference,
          source: 'FLUTTERWAVE',
          status: 'PROCESSED',
        },
      });

      return {
        credited: true,
        walletId: wallet.id,
        amount,
        balance: updatedWallet.balance,
        transactionReference,
      };
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.wallet.findFirst({ where: { userId } });
  }

  async create(data: {
    userId: string;
    virtualAccountNumber: string;
    virtualBankName: string;
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
      where: { virtualAccountNumber: accountNumber },
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
          balanceAfter: Number(wallet.balance) + amount,
        },
      });

      return { success: true };
    });
  }

  async creditWalletFromFlutterwave(
    walletReference: string,
    transactionReference: string,
    amount: number,
  ) {
    return this.handleFlutterwaveWebhook({
      walletReference,
      transactionReference,
      amount,
      currency: 'NGN',
    });
  }
}
