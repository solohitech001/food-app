import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy/jwt.strategy';
import { TermiiModule } from 'src/termii/termii.modle';
import { AfricasTalkingModule } from 'src/africastalking/africastalking.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    TermiiModule,
    AfricasTalkingModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TermiiModule],
})
export class AuthModule {}
