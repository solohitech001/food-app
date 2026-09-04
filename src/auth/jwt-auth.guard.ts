import {
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { AuthGuard } from  '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🔥 JWT GUARD RUNNING');

    return super.canActivate(context);
  }

  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ) {
    console.log('🔥 JWT GUARD RESULT');
    console.log('❌ ERROR:', err);
    console.log('👤 USER:', user);
    console.log('ℹ️ INFO:', info);

    return super.handleRequest(
      err,
      user,
      info,
      context,
      status,
    );
  }
}