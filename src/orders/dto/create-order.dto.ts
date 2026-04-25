import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}