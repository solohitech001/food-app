import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class VerifyBankDto {
  @ApiProperty({
    example: '058',
    description: 'CBN Bank Code',
  })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({
    example: '0123456789',
    description: '10-digit account number',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  accountNumber: string;
}

export class VerifyBankDataDto {
  @ApiProperty({
    example: 'SOLOMON JOHN',
    description: 'Verified account holder name',
  })
  accountName: string;

  @ApiProperty({
    example: '0123456789',
    description: 'Verified account number',
  })
  accountNumber: string;

  @ApiProperty({
    example: '058',
    description: 'CBN bank code',
  })
  bankCode: string;

  @ApiProperty({
    example: 'Guaranty Trust Bank',
    description: 'Bank name',
  })
  bankName: string;
}

export class VerifyBankResponseDto {
  @ApiProperty({
    example: true,
    description: 'Request status',
  })
  success: boolean;

  @ApiProperty({
    example: 'Bank account verified successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    type: VerifyBankDataDto,
  })
  data: VerifyBankDataDto;
}