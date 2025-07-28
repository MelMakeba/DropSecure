import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './users.service';
import { UpdateProfileDto } from './dto/update_profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/interfaces/user.interface';
import { Exclude, plainToInstance } from 'class-transformer';
import { ApiResponseService } from '../shared/api-response.service';

class UserResponse {
  @Exclude() password: string;
  constructor(partial: Partial<UserResponse>) {
    Object.assign(this, partial);
  }
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly apiResponse: ApiResponseService,
  ) {}

  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    const data = users.map((u) =>
      plainToInstance(UserResponse, u, { excludeExtraneousValues: true }),
    );
    return this.apiResponse.success(data, 'Users retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.findOne(id);
    const data = plainToInstance(UserResponse, user, {
      excludeExtraneousValues: true,
    });
    return this.apiResponse.success(data, 'User retrieved successfully');
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.userService.updateProfile(id, dto);
    const data = plainToInstance(UserResponse, user, {
      excludeExtraneousValues: true,
    });
    return this.apiResponse.success(data, 'User updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.deleteUser(id);
    return this.apiResponse.success(null, 'User deleted');
  }
}
