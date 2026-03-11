import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    return {
      message: 'Protected route accessed',
      user: req.user,
    };
  }
}
