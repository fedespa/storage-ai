import { Inject, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import type { ConfigType } from '@nestjs/config';
import mailConfig from 'src/config/mail.config';
import { EmailMessage, EmailService } from './email.interface';

@Injectable()
export class MailService implements EmailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(
    @Inject(mailConfig.KEY)
    private readonly config: ConfigType<typeof mailConfig>,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    if (!this.config.host) {
      this.logger.warn('SMTP is not configured. The email was not sent.');
      return;
    }

    const transporter = this.getTransporter();

    await transporter.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.username
        ? {
            user: this.config.username,
            pass: this.config.password,
          }
        : undefined,
    });

    return this.transporter;
  }
}