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

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { WalletService } from './wallet.service';
import { TransactionService } from '../transaction/transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Wallet')
@ApiBearerAuth()
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
  @ApiOperation({
    summary: 'Create user wallet',
    description:
      'Creates a Flutterwave wallet account for the authenticated user. BVN or NIN may be required for wallet activation and KYC verification.',
  })
  @ApiBody({
    description: 'KYC information required to create the wallet',
    schema: {
      type: 'object',
      properties: {
        bvn: {
          type: 'string',
          example: '22222222222',
          description: 'Bank Verification Number',
        },
        nin: {
          type: 'string',
          example: '12345678901',
          description: 'National Identification Number',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User wallet created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid KYC information or wallet creation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. A valid JWT token is required.',
  })
  async createWallet(
    @Req() req: any,
    @Body()
    body: {
      bvn?: string;
      nin?: string;
    },
  ) {
    const userId = req.user.id;

    return this.walletService.createUserWallet(userId, {
      bvn: body.bvn,
      nin: body.nin,
    });
  }

  /* ============================
     CREATE VENDOR WALLET
  ============================ */

  @Post('create/vendor')
  @ApiOperation({
    summary: 'Create vendor wallet',
    description:
      'Creates a Flutterwave wallet account for the authenticated vendor. The authenticated user must already have a vendor profile.',
  })
  @ApiBody({
    description: 'KYC information required to create the vendor wallet',
    schema: {
      type: 'object',
      properties: {
        bvn: {
          type: 'string',
          example: '22222222222',
          description: 'Bank Verification Number',
        },
        nin: {
          type: 'string',
          example: '12345678901',
          description: 'National Identification Number',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Vendor wallet created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Vendor profile not found or wallet creation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. A valid JWT token is required.',
  })
  async createVendorWallet(
    @Req() req: any,
    @Body()
    body: {
      bvn?: string;
      nin?: string;
    },
  ) {
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

    return this.walletService.createVendorWallet(vendor.id, {
      bvn: body.bvn,
      nin: body.nin,
    });
  }

  /* ============================
     GET FULL WALLET
  ============================ */

  @Get('me')
  @ApiOperation({
    summary: 'Get my wallet',
    description:
      'Returns the complete wallet information belonging to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet information retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. A valid JWT token is required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found.',
  })
  async getMyWallet(@Req() req: any) {
    return this.walletService.getMyWallet(req.user.id);
  }

  /* ============================
     GET BALANCE ONLY
  ============================ */

  @Get('balance')
  @ApiOperation({
    summary: 'Get wallet balance',
    description:
      'Returns the current wallet balance of the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. A valid JWT token is required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found.',
  })
  async getBalance(@Req() req: any) {
    return this.walletService.getBalance(req.user.id);
  }

  /* ============================
     TRANSFER USER → VENDOR
  ============================ */

  @Post('transfer')
  @ApiOperation({
    summary: 'Transfer money to vendor',
    description:
      'Transfers money from the authenticated user wallet to a vendor wallet.',
  })
  @ApiBody({
    description: 'Transfer information',
    schema: {
      type: 'object',
      required: ['vendorId', 'amount'],
      properties: {
        vendorId: {
          type: 'string',
          example: 'clx123456789',
          description: 'ID of the vendor receiving the money',
        },
        amount: {
          type: 'number',
          example: 5000,
          description: 'Amount to transfer',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Transfer completed successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid transfer details, insufficient balance, or vendor wallet not found.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. A valid JWT token is required.',
  })
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
  @ApiOperation({
    summary: 'Withdraw money',
    description:
      'Allows an authenticated vendor to withdraw money from their wallet.',
  })
  @ApiBody({
    description: 'Withdrawal information',
    schema: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: {
          type: 'number',
          example: 10000,
          description: 'Amount to withdraw',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal request processed successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Vendor profile not found, insufficient balance, or invalid withdrawal amount.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. A valid JWT token is required.',
  })
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
  @ApiOperation({
    summary: 'Get transaction history',
    description:
      'Returns the transaction history associated with the authenticated user wallet.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. A valid JWT token is required.',
  })
  async getTransactions(@Req() req: any) {
    return this.transactionService.getUserTransactions(
      req.user.id,
    );
  }

  /* ============================
     GET WALLET BY ID
  ============================ */

  @Get(':walletId')
  @ApiOperation({
    summary: 'Get wallet transactions by wallet ID',
    description:
      'Returns  transaction information associated with a specific wallet ID.',
  })
  @ApiParam({
    name: 'walletId',
    description: 'Unique wallet ID',
    example: 'clx123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet transactions retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. A valid JWT token is required.',
  })
  async getWalletById(
    @Param('walletId') walletId: string,
  ) {
    return this.transactionService.getWalletTransactions(
      walletId,
    );
  }
}