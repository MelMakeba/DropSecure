import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';
import { UserService } from './users.service';
import { ApiResponseService } from '../shared/api-response.service';
import { UpdateUserDto, CreateUserDto } from './dto/user.dto';
import { ApiResponse as ApiResponseInterface } from '../shared/interfaces/api-response.interface';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UserService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description: 'Retrieve all users with pagination and filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Object.values(UserRole),
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ): Promise<ApiResponseInterface> {
    const result = await this.usersService.getAllUsers({
      page: page || 1,
      limit: limit || 10,
      role,
      search,
    });

    return this.apiResponseService.paginated(
      result.users,
      result.page,
      result.limit,
      result.total,
      'Users retrieved successfully',
    );
  }

  @Get('role/:role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get users by role (Admin only)',
    description: 'Get all users with a specific role',
  })
  @ApiParam({
    name: 'role',
    enum: Object.values(UserRole),
    description: 'User role',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  async getUsersByRole(
    @Param('role') role: UserRole,
  ): Promise<ApiResponseInterface> {
    const users = await this.usersService.getUsersByRole(role);

    return this.apiResponseService.success(
      users,
      `${role} users retrieved successfully`,
    );
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get the authenticated user profile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  async getUserProfile(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponseInterface> {
    const user = await this.usersService.getUserById(req.user.id);

    return this.apiResponseService.success(
      user,
      'User profile retrieved successfully',
    );
  }

  @Put('profile')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the authenticated user profile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully',
  })
  async updateUserProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponseInterface> {
    const updatedUser = await this.usersService.updateUser(
      req.user.id,
      updateUserDto,
    );

    return this.apiResponseService.success(
      updatedUser,
      'User profile updated successfully',
    );
  }

  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Create new user (Admin only)',
    description: 'Create a new user account',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponseInterface> {
    const newUser = await this.usersService.createUser({
      ...createUserDto,
      phone: createUserDto.phone ?? '',
    });

    return this.apiResponseService.success(
      newUser,
      'User created successfully',
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete user (Admin only)',
    description: 'Delete a user account',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseInterface> {
    await this.usersService.deleteUser(id);

    return this.apiResponseService.success(null, 'User deleted successfully');
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user by ID (Admin only)',
    description: 'Get detailed user information',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
  })
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseInterface> {
    const user = await this.usersService.getUserById(id);

    return this.apiResponseService.success(user, 'User retrieved successfully');
  }
}
