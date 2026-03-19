import { IsString, IsIn } from 'class-validator';

export class CreateRiderDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsIn(['BIKE', 'CAR'])
  vehicleType: string;

  @IsString()
  plateNumber: string;
}