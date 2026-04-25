import { IsString, IsNotEmpty } from 'class-validator';

export class OrderParamDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}