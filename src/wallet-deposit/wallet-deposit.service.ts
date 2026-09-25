import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DepositStatus,
  TransactionSource,
  TransactionType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { FlutterwaveService } from '../fltterwave/flutterwave.service';

@Injectable()
export class WalletDepositService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flutterwaveService: FlutterwaveService,
  ) {}

  /**
   * Create a wallet deposit and initialize Flutterwave Checkout.
   *
   * Flow:
   *
   * User enters amount
   *       ↓
   * Create PENDING deposit
   *       ↓
   * Generate unique reference
   *       ↓
   * Get user's Flutterwave customer information
   *       ↓
   * Initialize Flutterwave Checkout
   *       ↓
   * Return payment link
   *
   * The wallet is NOT credited here.
   * The wallet is only credited after payment
   * has been successfully verified.
   */
  async createDeposit(userId: string, amount: number, currency = 'NGN') {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (!Number.isFinite(amount)) {
      throw new BadRequestException('Invalid deposit amount');
    }

    if (!currency) {
      currency = 'NGN';
    }

    /**
     * Get the authenticated user's information.
     */
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.email) {
      throw new BadRequestException(
        'User email is required to initialize payment',
      );
    }

    /**
     * Generate a unique payment reference.
     */
    const reference = `WALLET_DEP_${randomUUID()}`;

    /**
     * Create the pending deposit first.
     */
    const deposit = await this.prisma.walletDeposit.create({
      data: {
        userId,
        amount,
        currency,
        reference,
        status: DepositStatus.PENDING,
      },
    });

    try {
      /**
       * Initialize Flutterwave Standard Checkout.
       */
      const payment = await this.flutterwaveService.initializePayment({
        amount,
        currency,
        txRef: reference,

        customer: {
          email: user.email,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          phoneNumber: user.phoneNumber ?? undefined,
        },

        /**
         * Change this URL to your actual frontend
         * payment callback page.
         */
        redirectUrl: 'http://localhost:3000/payment/callback',
      });

      if (!payment.link) {
        throw new Error('Flutterwave did not return a checkout link');
      }

      /**
       * Return the deposit and checkout URL.
       */
      return {
        deposit,
        paymentLink: payment.link,
      };
    } catch (error) {
      console.error('Wallet deposit payment initialization failed:', error);

      /**
       * Mark the deposit as failed if Flutterwave
       * could not initialize the payment.
       */
      await this.prisma.walletDeposit.update({
        where: {
          id: deposit.id,
        },
        data: {
          status: DepositStatus.FAILED,
        },
      });

      throw new BadRequestException('Unable to initialize Flutterwave payment');
    }
  }

  /**
   * Get all deposits belonging to a user.
   */
  async getUserDeposits(userId: string) {
    return this.prisma.walletDeposit.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single deposit belonging to a user.
   */
  async getDeposit(userId: string, depositId: string) {
    const deposit = await this.prisma.walletDeposit.findFirst({
      where: {
        id: depositId,
        userId,
      },
    });

    if (!deposit) {
      throw new NotFoundException('Wallet  deposit not found');
    }

    return deposit;
  }

  /**
   * Complete a wallet deposit and credit the wallet.
   *
   * This should ONLY happen after the Flutterwave
   * payment has been successfully verified.
   */
  async completeDeposit(reference: string, flutterwaveId?: string) {
    console.log('====================================');
    console.log('💰 COMPLETE DEPOSIT CALLED');
    console.log('📌 Deposit reference:', reference);
    console.log('📌 Flutterwave ID:', flutterwaveId);

    return this.prisma.$transaction(async (tx) => {
      console.log('🔎 Looking for deposit...');

      const deposit = await tx.walletDeposit.findUnique({
        where: {
          reference,
        },
      });

      console.log('📦 Deposit found:', deposit);

      if (!deposit) {
        throw new NotFoundException(
          `Wallet deposit with reference ${reference} was not found`,
        );
      }

      console.log('📊 Deposit status:', deposit.status);
      console.log('💵 Deposit amount:', deposit.amount);
      console.log('👤 Deposit user:', deposit.userId);

      if (deposit.status === DepositStatus.SUCCESSFUL) {
        console.log('⚠️ Deposit already successful');
        return deposit;
      }

      console.log('🔎 Looking for user wallet...');

      const wallet = await tx.wallet.findFirst({
        where: {
          userId: deposit.userId,
        },
      });

      console.log('👛 Wallet found:', wallet);

      if (!wallet) {
        throw new NotFoundException('Wallet not found for this user');
      }

      const amount = Number(deposit.amount);
      const currentBalance = Number(wallet.balance);
      const newBalance = currentBalance + amount;

      console.log('💰 Current balance:', currentBalance);
      console.log('💵 Deposit amount:', amount);
      console.log('💰 New balance:', newBalance);

      console.log('💳 Updating wallet balance...');

      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: newBalance,
          version: {
            increment: 1,
          },
        },
      });

      console.log('✅ Wallet updated:', updatedWallet.balance);

      console.log('🧾 Creating transaction...');

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: TransactionType.CREDIT,
          source: TransactionSource.FLUTTERWAVE,
          reference: deposit.reference,
          narration: 'Wallet deposit via Flutterwave',
          balanceAfter: newBalance,
          status: 'SUCCESS',
          userId: deposit.userId,
        },
      });

      console.log('✅ Transaction created:', transaction.id);

      console.log('📝 Marking deposit successful...');

      const completedDeposit = await tx.walletDeposit.update({
        where: {
          id: deposit.id,
        },
        data: {
          status: DepositStatus.SUCCESSFUL,
          flutterwaveId,
        },
      });

      console.log('✅ DEPOSIT COMPLETED');
      console.log('====================================');

      return completedDeposit;
    });
  }

  /**
   * Mark a deposit as failed.
   */
  async failDeposit(reference: string) {
    const deposit = await this.prisma.walletDeposit.findUnique({
      where: {
        reference,
      },
    });

    if (!deposit) {
      throw new NotFoundException('Wallet deposit not found');
    }

    if (deposit.status === DepositStatus.SUCCESSFUL) {
      throw new BadRequestException(
        'A successful deposit cannot be marked as failed',
      );
    }

    return this.prisma.walletDeposit.update({
      where: {
        reference,
      },
      data: {
        status: DepositStatus.FAILED,
      },
    });
  }
}
