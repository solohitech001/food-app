import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client'; // assuming you exported your Prisma enums

export class UpdateRoleDto {
  @ApiProperty({ enum: Role, description: 'New role for the user' })
  @IsEnum(Role)
  role: Role;
}