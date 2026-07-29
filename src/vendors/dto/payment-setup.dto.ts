import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class PaymentSetupDto {
  @ApiProperty({
    example: '0123456789',
    description: 'Vendor bank account number',
    minLength: 10,
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  accountNumber: string;

  @ApiProperty({
    example: '058',
    description: 'Bank code returned from the supported bank list',
  })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({
    example: 'Guaranty Trust Bank',
    description: 'Name of the bank',
  })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({
    example: 'SOLOMON JOHN',
    description: 'Verified account holder name',
  })
  @IsString()
  @IsNotEmpty()
  accountName: string;
}