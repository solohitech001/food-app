import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.phoneNumber);
  }

  @Post('send-otp')
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  sendOtp(@Body() registerDto: RegisterDto) {
    return this.authService.sendOtp(registerDto.phoneNumber);
  }

  @Post('verify-otp')
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phoneNumber, verifyOtpDto.otp);
  }

  /* =========================
     UPDATE USER LOCATION
  ========================= */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Adds "Authorize" button in Swagger
  @Post('update-location')
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  updateLocation(@Req() req, @Body() updateLocationDto: UpdateLocationDto) {
    const { latitude, longitude, city, state } = updateLocationDto;

    return this.authService.updateUserLocation(
      req.user.id,
      latitude,
      longitude,
      city,
      state,
    );
  }
}