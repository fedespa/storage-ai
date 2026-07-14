import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PasswordResetController } from '../password-reset.controller';
import { PasswordResetService } from '../password-reset.service';

describe('PasswordResetController', () => {
  let application: INestApplication<App>;
  const requestPasswordReset = jest.fn<
    Promise<{ message: string }>,
    [string]
  >();
  const resetPassword = jest.fn<Promise<void>, [string, string]>();

  beforeEach(async () => {
    requestPasswordReset.mockResolvedValue({
      message:
        'Si el correo est\u00e1 registrado, recibir\u00e1s un enlace para restablecer tu contrase\u00f1a.',
    });
    resetPassword.mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      controllers: [PasswordResetController],
      providers: [
        {
          provide: PasswordResetService,
          useValue: { requestPasswordReset, resetPassword },
        },
      ],
    }).compile();

    application = module.createNestApplication();
    application.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await application.init();
  });

  afterEach(async () => {
    await application.close();
    jest.clearAllMocks();
  });

  it('accepts a valid reset request and delegates the email to the service', async () => {
    await request(application.getHttpServer())
      .post('/auth/password-reset/request')
      .send({ email: 'user@example.com' })
      .expect(200)
      .expect({
        message:
          'Si el correo est\u00e1 registrado, recibir\u00e1s un enlace para restablecer tu contrase\u00f1a.',
      });

    expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com');
  });

  it('rejects invalid request bodies before calling the service', async () => {
    await request(application.getHttpServer())
      .post('/auth/password-reset/request')
      .send({ email: 'not-an-email' })
      .expect(400);

    await request(application.getHttpServer())
      .post('/auth/password-reset/confirm')
      .send({ token: '', newPassword: 'short' })
      .expect(400);

    expect(requestPasswordReset).not.toHaveBeenCalled();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('confirms a password reset and returns the success message', async () => {
    await request(application.getHttpServer())
      .post('/auth/password-reset/confirm')
      .send({ token: 'reset-token', newPassword: 'new-password' })
      .expect(200)
      .expect({ message: 'La contrase\u00f1a fue restablecida exitosamente.' });

    expect(resetPassword).toHaveBeenCalledWith('reset-token', 'new-password');
  });
});
