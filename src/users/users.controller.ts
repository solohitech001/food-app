import { Controller, Get, Patch, UseGuards, Req, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto'; // <-- import your new DTO
// import { AdminGuard } from '../auth/jwt-auth.guard'; // optional, if you create an admin guard
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/role.guard';

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

  // Admin: update user role


  // Admin: update user role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Patch(':id/role')
updateUserRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
  return this.usersService.updateUserRole(id, dto.role);
}
}