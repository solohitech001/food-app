import { IsIn } from 'class-validator';

export class UpdateRiderStatusDto {
  @IsIn(['ONLINE', 'OFFLINE'])
  status: string;
}