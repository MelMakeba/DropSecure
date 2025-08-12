/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as ejs from 'ejs';
import { PrismaService } from 'src/prisma/prisma.service';

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

export interface WelcomeContext {
  verifyUrl: string;
  name: string;
  verificationCode: string;
  frontendUrl?: string;
}

export interface PackageCreatedContext {
  name: string;
  trackingNumber: string;
  packageDetails: string;
  receiverName: string;
  price: number;
  description?: string;
  pickupAddress?: string;
  estimatedDelivery?: string;
  specialInstructions?: string;
  packageDescription?: string;
  estimatedDeliveryDate?: string;
  trackingUrl?: string;
}

export interface PickupContext {
  name: string;
  trackingNumber: string;
  pickupTime: string;
  courierName: string;
  [key: string]: any;
}

export interface DeliveryContext {
  name: string;
  trackingNumber: string;
  deliveryTime: string;
  [key: string]: any;
}

export interface PasswordResetContext {
  name: string;
  token: string;
  expiresIn: string;
  resetUrl?: string;
}

export interface StatusUpdateContext {
  name: string;
  trackingNumber: string;
  oldStatus: string;
  newStatus: string;
  statusMessage: string;
  location?: string;
  estimatedDelivery?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesPath: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.templatesPath = path.join(process.cwd(), 'src/templates');
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(this.configService.get<string>('SMTP_PORT', '587')),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
    this.logger.log('Email transporter initialized successfully');
  }

  async sendEmail(
    options: EmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let html = options.html;

      if (options.template && options.context) {
        html = await this.renderTemplate(options.template, options.context);
      }

      const mailOptions = {
        from: this.configService.get<string>(
          'MAIL_FROM',
          this.configService.get<string>('SMTP_USER', ''),
        ),
        to: options.to,
        subject: options.subject,
        html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${options.to}: ${result.messageId}`,
      );

      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
      );
      return { success: false, error: error.message };
    }
  }

  // 1. Welcome Email
  async sendWelcomeEmail(to: string, context: WelcomeContext) {
    const emailOptions: EmailOptions = {
      to,
      subject: 'Welcome to DropSecure!',
      template: 'welcome',
      context: {
        ...context,
        verifyUrl:
          context.verifyUrl ||
          `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/verify-email?code=${context.verificationCode}`,
        frontendUrl:
          context.frontendUrl ||
          this.configService.get<string>(
            'FRONTEND_URL',
            'http://localhost:4200',
          ),
      },
    };
    return this.sendEmail(emailOptions);
  }

  // 2. Package Created Email
  async sendPackageCreatedEmail(to: string, context: PackageCreatedContext) {
    const emailOptions: EmailOptions = {
      to,
      subject: 'DropSecure - Your Package Has Been Created',
      template: 'package-created',
      context: {
        ...context,
        // Map the context properties to match template variables
        packageDescription:
          context.description ||
          context.packageDetails ||
          'Package details not provided',
        estimatedDeliveryDate: context.estimatedDelivery
          ? new Date(context.estimatedDelivery).toLocaleDateString()
          : 'To be determined',
        trackingUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/track/${context.trackingNumber}`,
      },
    };
    return this.sendEmail(emailOptions);
  }

  // 3. Pickup Confirmation Email
  async sendPickupConfirmation(to: string, context: PickupContext) {
    const emailOptions: EmailOptions = {
      to,
      subject: 'DropSecure - Package Pickup Confirmation',
      template: 'pickup-confirmation',
      context,
    };
    return this.sendEmail(emailOptions);
  }

  // 4. Delivery Notification Email
  async sendDeliveryNotification(to: string, context: DeliveryContext) {
    const emailOptions: EmailOptions = {
      to,
      subject: 'DropSecure - Package Delivered',
      template: 'delivery-notification',
      context,
    };
    return this.sendEmail(emailOptions);
  }

  // 5. Password Reset Email
  async sendPasswordResetEmail(to: string, context: PasswordResetContext) {
    const emailOptions: EmailOptions = {
      to,
      subject: 'DropSecure - Password Reset Request',
      template: 'password-reset',
      context: {
        ...context,
        resetUrl:
          context.resetUrl ||
          `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/reset-password?token=${context.token}`,
        expiresIn: context.expiresIn || '1 hour',
      },
    };
    return this.sendEmail(emailOptions);
  }

  async sendPackageStatusUpdate(to: string, context: StatusUpdateContext) {
    const emailOptions: EmailOptions = {
      to,
      subject: `DropSecure - Package Status Update: ${context.newStatus}`,
      template: 'package-status-update',
      context,
    };
    return this.sendEmail(emailOptions);
  }

  async sendPackageAssignmentEmail(
    to: string,
    context: {
      courierName: string;
      trackingNumber: string;
      packageDetails: string;
      pickupAddress: string;
      deliveryAddress: string;
      senderPhone: string;
      receiverPhone: string;
    },
  ) {
    const emailOptions: EmailOptions = {
      to,
      subject: 'DropSecure - New Package Assignment',
      template: 'package-assignment',
      context,
    };
    return this.sendEmail(emailOptions);
  }

  // Retry logic for sending email (simple version)
  async sendWithRetry(options: EmailOptions, retries = 2) {
    let attempt = 0;
    let lastError: any;
    while (attempt <= retries) {
      const result = await this.sendEmail(options);
      if (result.success) return result;
      lastError = result.error;
      attempt++;
      this.logger.warn(`Retrying email to ${options.to} (attempt ${attempt})`);
    }
    return { success: false, error: lastError };
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    try {
      const filename = `${templateName}.ejs`;
      const templatePath = path.join(this.templatesPath, filename);

      if (!fs.existsSync(templatePath)) {
        throw new Error(
          `Template ${templateName} not found at ${templatePath}`,
        );
      }

      const templateOptions = {
        filename: templatePath,
        cache: process.env.NODE_ENV === 'production',
        compileDebug: process.env.NODE_ENV !== 'production',
      };

      const html = await ejs.renderFile(templatePath, context, templateOptions);
      return html;
    } catch (error) {
      this.logger.error(
        `Template rendering failed for ${templateName}: ${error.message}`,
      );
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; details?: string }> {
    try {
      await this.transporter.verify();
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        details: error.message,
      };
    }
  }

  async sendContactFormNotification(contactData: any): Promise<void> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src/templates/contact-form-notification.ejs',
      );
      const template = await fs.promises.readFile(templatePath, 'utf-8');

      const html = ejs.render(template, {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone || 'Not provided',
        subject: contactData.subject,
        message: contactData.message,
        submittedAt: new Date().toLocaleString(),
      });

      const mailOptions = {
        from: this.configService.get('EMAIL_FROM'),
        to: this.configService.get('ADMIN_EMAIL') || 'admin@dropsecure.com',
        subject: `New Contact Form Submission: ${contactData.subject}`,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Contact form notification email sent to admin');
    } catch (error) {
      console.error('Error sending contact form notification email:', error);
      throw new Error('Failed to send contact form notification email');
    }
  }

  async sendContactFormConfirmation(
    email: string,
    name: string,
  ): Promise<void> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src/templates/contact-form-user-confirmation.ejs',
      );
      const template = await fs.promises.readFile(templatePath, 'utf-8');

      const html = ejs.render(template, {
        name,
        supportEmail:
          this.configService.get('SUPPORT_EMAIL') || 'support@dropsecure.com',
      });

      const mailOptions = {
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Thank you for contacting DropSecure',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Contact form confirmation email sent to user');
    } catch (error) {
      console.error('Error sending contact form confirmation email:', error);
      throw new Error('Failed to send contact form confirmation email');
    }
  }

  async sendPackageIncomingNotification(
    email: string,
    data: any,
  ): Promise<void> {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src/templates/package-incoming-notification.ejs',
      );
      const template = await fs.promises.readFile(templatePath, 'utf-8');

      const html = ejs.render(template, {
        receiverName: data.receiverName,
        trackingNumber: data.trackingNumber,
        senderName: data.senderName,
        packageDescription: data.packageDescription,
        estimatedDeliveryDate:
          data.estimatedDeliveryDate &&
          new Date(data.estimatedDeliveryDate).toLocaleDateString(),
        trackingUrl: `${this.configService.get('FRONTEND_URL')}/track/${data.trackingNumber}`,
      });

      const mailOptions = {
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: `Package Coming Your Way - Tracking: ${data.trackingNumber}`,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Package incoming notification email sent');
    } catch (error) {
      console.error(
        'Error sending package incoming notification email:',
        error,
      );
      throw new Error('Failed to send package incoming notification email');
    }
  }
}
