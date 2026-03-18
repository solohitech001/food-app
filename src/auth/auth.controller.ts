import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.phoneNumber);
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to user' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  sendOtp(@Body() registerDto: RegisterDto) {
    return this.authService.sendOtp(registerDto.phoneNumber);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify user OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phoneNumber, verifyOtpDto.otp);
  }

  /* =========================
     UPDATE USER LOCATION
  ========================= */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // 🔑 Swagger knows this route requires a JWT Bearer token
  @ApiOperation({ summary: 'Update user location (requires Bearer token)' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
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