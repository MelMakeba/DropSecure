import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';
import { ContactService } from './contact.service';
import { ApiResponseService } from '../shared/api-response.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { ApiResponse as ApiResponseInterface } from '../shared/interfaces/api-response.interface';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Submit contact form',
    description: 'Submit a contact form message (no authentication required)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contact form submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async submitContactForm(
    @Body() contactFormDto: ContactFormDto,
  ): Promise<ApiResponseInterface> {
    const submission =
      await this.contactService.submitContactForm(contactFormDto);

    return this.apiResponseService.success(
      { submissionId: submission.id },
      'Thank you for contacting us! We will get back to you soon.',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all contact submissions (Admin only)',
    description: 'Retrieve all contact form submissions',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submissions retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
  })
  async getContactSubmissions(): Promise<ApiResponseInterface> {
    const submissions = await this.contactService.getAllSubmissions();

    return this.apiResponseService.success(
      submissions,
      'Contact submissions retrieved successfully',
    );
  }

  @Put(':id/mark-read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mark contact submission as read (Admin only)',
    description: 'Mark a contact submission as read',
  })
  @ApiParam({ name: 'id', description: 'Contact submission UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact submission marked as read',
  })
  async markAsRead(@Param('id') id: string): Promise<ApiResponseInterface> {
    await this.contactService.markAsRead(id);

    return this.apiResponseService.success(
      null,
      'Contact submission marked as read',
    );
  }
}
