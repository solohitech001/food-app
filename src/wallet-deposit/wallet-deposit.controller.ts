import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
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
import type { Request } from 'express';

import { WalletDepositService } from './wallet-deposit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Wallet Deposits')
@ApiBearerAuth()
@Controller('wallet-deposits')
@UseGuards(JwtAuthGuard)
export class WalletDepositController {
  constructor(
    private readonly walletDepositService: WalletDepositService,
  ) {}

  /**
   * Create a pending  wallet deposit.
   *
   * The user only provides the amount.
   * The backend generates the unique deposit reference.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a wallet deposit',
    description:
      'Creates a pending wallet deposit using the amount provided by the authenticated user. The deposit reference is generated automatically by the backend. The wallet is only credited after Flutterwave confirms the payment.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          example: 5000,
          description: 'Amount the user wants to deposit into their wallet.',
        },
        currency: {
          type: 'string',
          example: 'NGN',
          default: 'NGN',
          description: 'Deposit currency.',
        },
      },
      required: ['amount'],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Wallet deposit created successfully and is awaiting payment confirmation.',
    schema: {
      example: {
        id: 'b4c9a9f7-0e88-4e6e-90a5-8f6e1b2a1234',
        userId: '7a8f9c10-1234-4567-8901-abcdef123456',
        amount: '5000',
        currency: 'NGN',
        reference:
          'WALLET_DEP_550e8400-e29b-41d4-a716-446655440000',
        status: 'PENDING',
        createdAt: '2026-09-21T10:00:00.000Z',
        updatedAt: '2026-09-21T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid deposit amount or request.',
  })
  async createDeposit(
    @Req() req: Request,
    @Body()
    body: {
      amount: number;
      currency?: string;
    },
  ) {
    const userId = (req.user as any).id;

    return this.walletDepositService.createDeposit(
      userId,
      body.amount,
      body.currency ?? 'NGN',
    );
  }

  /**
   * Get logged-in user's deposits.
   */
  @Get()
  @ApiOperation({
    summary: 'Get my wallet deposits',
    description:
      'Returns all wallet deposits belonging to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns all wallet deposits belonging to the authenticated user.',
  })
  async getMyDeposits(@Req() req: Request) {
    const userId = (req.user as any).id;

    return this.walletDepositService.getUserDeposits(userId);
  }

  /**
   * Get one deposit.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a wallet deposit',
    description:
      'Returns a specific wallet deposit belonging to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Wallet deposit ID',
    example: 'b4c9a9f7-0e88-4e6e-90a5-8f6e1b2a1234',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet deposit returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet deposit not found.',
  })
  async getDeposit(
    @Req() req: Request,
    @Param('id') depositId: string,
  ) {
    const userId = (req.user as any).id;

    return this.walletDepositService.getDeposit(
      userId,
      depositId,
    );
  }
}
