import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module'; // make sure you have this

@Module({
  imports: [PrismaModule],      // PrismaService comes from here
  controllers: [UsersController],
  providers: [UsersService],    // <-- provide UsersService
  exports: [UsersService],      // optional, if other modules need it
})
export class UsersModule {}