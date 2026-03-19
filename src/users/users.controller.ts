import { Controller, Get, Patch, UseGuards, Req, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {UsersService} from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Get own profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProfile(@Req() req) {
    return this.usersService.getMyProfile(req.user.id);
  }

  // Update own profile
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@Req() req, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  // Admin: get any user
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  // Admin: get all users
  @UseGuards(JwtAuthGuard)
  @Get('')
  getAllUsers() {
    return this.usersService.getAllUsers();
  }
}