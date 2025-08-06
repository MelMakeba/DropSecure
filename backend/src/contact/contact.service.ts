import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { EmailService } from '../shared/mailer/email.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async submitContactForm(dto: ContactFormDto) {
    // Save to database
    const submission = await this.prisma.contactSubmission.create({
      data: dto,
    });

    // Send notification email to admin
    await this.emailService.sendContactFormNotification(dto);

    // Send confirmation email to user
    await this.emailService.sendContactFormConfirmation(dto.email, dto.name);

    return submission;
  }

  async getAllSubmissions() {
    return this.prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.contactSubmission.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
