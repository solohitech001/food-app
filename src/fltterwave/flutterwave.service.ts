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
  private readonly secretHash = process.env.FLW_SECRET_HASH;

  /* ============================
     CREATE VIRTUAL ACCOUNT
  ============================ */
  async createVirtualAccount(data: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    bvn?: string;
    nin?: string;
    reference: string;
  }) {
    try {
      const res = await axios.post(
        `${this.baseUrl}/virtual-account-numbers`,
        {
          email: data.email,
          firstname: data.firstName,
          lastname: data.lastName,
          phonenumber: data.phoneNumber,
          currency: 'NGN',
          is_permanent: true,
          tx_ref: data.reference,
          narration: `${data.firstName} ${data.lastName}`,
          amount: 0,
          ...(data.bvn ? { bvn: data.bvn } : {}),
          ...(data.nin ? { nin: data.nin } : {}),
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
      console.error(
        'Flutterwave virtual account error:',
        error.response?.data || error.message,
      );

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
  extractFundingData(payload: any) {
    const data = payload?.data;

    if (!data) {
      return null;
    }

    const reference = data.tx_ref;
    const amount = Number(data.amount);

    if (!reference) {
      console.log('⚠️ Flutterwave webhook has no tx_ref');
      return null;
    }

    if (!amount || amount <= 0) {
      console.log('⚠️ Flutterwave webhook has invalid amount');
      return null;
    }

    return {
      reference,
      amount,
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
}
