import { registerAs } from '@nestjs/config';

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
  frontendUrl: string;
}

const parsePort = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
};

export default registerAs(
  'mail',
  (): MailConfig => ({
    host: process.env.SMTP_HOST || '',
    port: parsePort(process.env.SMTP_PORT, 587),
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    username: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  }),
);