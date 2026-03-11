import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.register(phoneNumber);
  }

  @Post('send-otp')
  sendOtp(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.sendOtp(phoneNumber);
  }

  @Post('verify-otp')
  verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otp') otp: string,
  ) {
    return this.authService.verifyOtp(phoneNumber, otp);
  }

  /* =========================
     UPDATE USER LOCATION
  ========================= */
  @UseGuards(JwtAuthGuard)
  @Post('update-location')
  updateLocation(@Req() req, @Body() body) {
    const { latitude, longitude, city, state } = body;

    return this.authService.updateUserLocation(
      req.user.id,
      latitude,
      longitude,
      city,
      state,
    );
  }
}
