import { Role } from '../enums/role.enum';
import { AccountStatus } from '../enums/account-status.enum';

export interface JwtPayload {
  sub: string;
  role: Role;
  status: AccountStatus;
}
