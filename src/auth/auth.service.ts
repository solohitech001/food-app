import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TermiiService } from '../termii/termii.service'; // ✅ changed

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private termii: TermiiService, // ✅ changed
  ) {}

  /* =========================
     REGISTER WITH PHONE
     ========================= */
  async register(phoneNumber: string) {
    const exists = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (exists) {
      throw new BadRequestException('Phone number already registered');
    }

    const user = await this.prisma.user.create({
      data: { phoneNumber },
    });

    return {
      message: 'Registration successful',
      userId: user.id,
    };
  }

  /* =========================
     SEND OTP (TERMII)
     ========================= */
  async sendOtp(phoneNumber: string) {
    console.log('PHONE FROM REQUEST:', phoneNumber);

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { phoneNumber },
      data: {
        otpCode: otp,
        otpExpiresAt: expires,
      },
    });

    // ✅ Send SMS via Termii
    await this.termii.sendOtp(phoneNumber, otp);

    return { message: 'OTP sent successfully' };
  }

  /* =========================
     VERIFY OTP & LOGIN
     ========================= */
  async verifyOtp(phoneNumber: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user || user.otpCode !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    await this.prisma.user.update({
      where: { phoneNumber },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        isVerified: true,
      },
    });

    const token = this.jwt.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    };
  }

  async updateUserLocation(userId, lat, lng, city, state) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        latitude: lat,
        longitude: lng,
        city,
        state,
      },
    });
  }
}
