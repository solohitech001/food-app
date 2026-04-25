import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FlutterwaveService {
  constructor(private prisma: PrismaService) {}
  private readonly baseUrl = 'https://api.flutterwave.com/v3';
  private readonly secretKey =
    'FLWSECK-b09e764b7e44a276b65c07440f0a3b94-19d8e5acc14vt-X';
  private readonly secretHash = 'http://localhost:3000/flutterwave/webhook';

  /* ============================
     CREATE VIRTUAL ACCOUNT
  ============================ */
  async createVirtualAccount(email: string, reference: string) {
    try {
      const res = await axios.post(
        `${this.baseUrl}/virtual-account-numbers`,
        {
          email,
          is_permanent: false,
          tx_ref: reference,
          narration: 'Platter Wallet',
          amount: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return res.data.data;
    } catch (error: any) {
      console.error(error.response?.data || error.message);

      throw new InternalServerErrorException(
        error.response?.data?.message || 'Flutterwave API failed',
      );
    }
  }

  /* ============================
     VERIFY WEBHOOK SIGNATURE
  ============================ */
  verifySignature(signature: string): boolean {
    return signature === this.secretHash;
  }

  /* ============================
     EXTRACT FUNDING DATA
     (Used by Webhook Controller)
  ============================ */
  extractFundingData(payload: any): {
    accountNumber: string;
    amount: number;
    reference: string;
  } | null {
    if (
      payload?.event !== 'charge.completed' ||
      payload?.data?.status !== 'successful'
    ) {
      return null;
    }

    return {
      accountNumber: payload.data?.meta?.virtual_account_number,
      amount: Number(payload.data?.amount),
      reference: payload.data?.tx_ref,
    };
  }

  async initiateTransfer(data: {
    amount: number;
    accountNumber: string;
    bankCode: string;
    narration: string;
    reference: string;
  }) {
    try {
      const res = await axios.post(
        `${this.baseUrl}/transfers`,
        {
          account_bank: data.bankCode,
          account_number: data.accountNumber,
          amount: data.amount,
          narration: data.narration,
          currency: 'NGN',
          reference: data.reference,
          debit_currency: 'NGN',
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return res.data;
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      throw new Error('Transfer failed');
    }
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
}
