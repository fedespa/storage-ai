import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EmailMessage } from '../../../common/mail/email.interface';
import { MailService } from '../../../common/mail/mail.service';
import { PasswordResetToken } from '../../../database/entities/password-reset-token.entity';
import { User } from '../../../database/entities/user.entity';
import { UserService } from '../../users/users.service';
import { PasswordResetService } from '../password-reset.service';

describe('PasswordResetService', () => {
  const genericMessage =
    'Si el correo est\u00e1 registrado, recibir\u00e1s un enlace para restablecer tu contrase\u00f1a.';

  it('returns the generic response without creating a token when the email is unknown', async () => {
    const findByEmail = jest
      .fn<Promise<User | null>, [string]>()
      .mockResolvedValue(null);
    const update = jest.fn<void, []>();
    const create = jest.fn<PasswordResetToken, [Partial<PasswordResetToken>]>();
    const save = jest.fn<void, []>();
    const repository = {
      update,
      create,
      save,
    } as unknown as Repository<PasswordResetToken>;
    const send = jest.fn<Promise<void>, [EmailMessage]>();
    const mailService = { send } as unknown as MailService;
    const service = createService({ repository, findByEmail, mailService });

    await expect(
      service.requestPasswordReset('unknown@example.com'),
    ).resolves.toEqual({ message: genericMessage });

    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('invalidates prior tokens, stores a hashed token, and sends the reset link', async () => {
    const user = { id: 'user-id', email: 'user@example.com' } as User;
    const findByEmail = jest
      .fn<Promise<User | null>, [string]>()
      .mockResolvedValue(user);
    const create = jest
      .fn<PasswordResetToken, [Partial<PasswordResetToken>]>()
      .mockImplementation((token) => token as PasswordResetToken);
    const save = jest
      .fn<Promise<void>, [PasswordResetToken]>()
      .mockResolvedValue(undefined);
    const update = jest
      .fn<Promise<void>, [object, object]>()
      .mockResolvedValue(undefined);
    const repository = {
      update,
      create,
      save,
    } as unknown as Repository<PasswordResetToken>;
    const send = jest
      .fn<Promise<void>, [EmailMessage]>()
      .mockResolvedValue(undefined);
    const mailService = { send } as unknown as MailService;
    const service = createService({ repository, findByEmail, mailService });
    const beforeRequest = Date.now();

    await expect(service.requestPasswordReset(user.email)).resolves.toEqual({
      message: genericMessage,
    });

    expect(update).toHaveBeenCalledWith(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );
    expect(create).toHaveBeenCalledTimes(1);
    const savedToken = create.mock.calls[0][0];
    expect(savedToken).toMatchObject({ userId: user.id, isUsed: false });
    expect(savedToken.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(savedToken.expiresAt).toBeInstanceOf(Date);
    expect(savedToken.expiresAt?.getTime()).toBeGreaterThanOrEqual(
      beforeRequest + 30 * 60 * 1000,
    );
    expect(save).toHaveBeenCalledWith(savedToken);

    const message = send.mock.calls[0]?.[0];
    expect(message).toBeDefined();
    if (!message) {
      throw new Error('Expected a reset email to be sent.');
    }
    expect(message).toMatchObject({
      to: user.email,
      subject: 'Restablecer contrase\u00f1a',
    });
    const resetUrl = message.text.match(/https?:\/\/\S+/)?.[0];
    expect(resetUrl).toBeDefined();
    if (!resetUrl) {
      throw new Error('Expected the email to include a reset URL.');
    }
    const rawToken = new URL(resetUrl).searchParams.get('token');
    expect(rawToken).not.toBeNull();
    expect(savedToken.tokenHash).toBe(
      crypto
        .createHash('sha256')
        .update(rawToken as string)
        .digest('hex'),
    );
  });

  it('updates the password and consumes a usable token in one transaction', async () => {
    const storedToken = createStoredToken();
    const update = jest
      .fn<Promise<void>, [object, object]>()
      .mockResolvedValue(undefined);
    const queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(storedToken),
    };
    const managerRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      update,
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(managerRepository),
    } as unknown as EntityManager;
    const transaction = jest.fn(
      async (callback: (transactionManager: EntityManager) => Promise<void>) =>
        callback(manager),
    );
    const updatePasswordHash = jest.fn().mockResolvedValue(undefined);
    const service = createService({
      dataSource: { transaction } as unknown as DataSource,
      updatePasswordHash,
    });

    await service.resetPassword('plain-token', 'new-password');

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'passwordResetToken.tokenHash = :tokenHash',
      { tokenHash: hashToken('plain-token') },
    );
    expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(updatePasswordHash).toHaveBeenCalledWith(
      storedToken.userId,
      expect.any(String),
      manager,
    );
    expect(update).toHaveBeenCalledWith(
      { tokenHash: storedToken.tokenHash },
      { isUsed: true },
    );
  });

  it.each([
    ['unknown', null],
    ['used', createStoredToken({ isUsed: true })],
    [
      'expired',
      createStoredToken({ expiresAt: new Date(Date.now() - 60_000) }),
    ],
  ])(
    'rejects a %s token without changing the password',
    async (_state, storedToken) => {
      const queryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(storedToken),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        }),
      } as unknown as EntityManager;
      const transaction = jest.fn(
        async (
          callback: (transactionManager: EntityManager) => Promise<void>,
        ) => callback(manager),
      );
      const updatePasswordHash = jest.fn<
        Promise<void>,
        [string, string, EntityManager?]
      >();
      const service = createService({
        dataSource: { transaction } as unknown as DataSource,
        updatePasswordHash,
      });

      await expect(
        service.resetPassword('unknown-token', 'new-password'),
      ).rejects.toThrow(UnauthorizedException);

      expect(updatePasswordHash).not.toHaveBeenCalled();
    },
  );
});

function createService({
  repository = {} as Repository<PasswordResetToken>,
  findByEmail = jest.fn<Promise<User | null>, [string]>(),
  mailService = {} as MailService,
  dataSource = {} as DataSource,
  updatePasswordHash = jest.fn<
    Promise<void>,
    [string, string, EntityManager?]
  >(),
}: {
  repository?: Repository<PasswordResetToken>;
  findByEmail?: jest.Mock<Promise<User | null>, [string]>;
  mailService?: MailService;
  dataSource?: DataSource;
  updatePasswordHash?: jest.Mock<
    Promise<void>,
    [string, string, EntityManager?]
  >;
} = {}): PasswordResetService {
  return new PasswordResetService(
    repository,
    { findByEmail, updatePasswordHash } as unknown as UserService,
    mailService,
    dataSource,
    {
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      from: 'no-reply@example.com',
      frontendUrl: 'https://app.example.com/',
    },
  );
}

function createStoredToken(
  values: Partial<Pick<PasswordResetToken, 'expiresAt' | 'isUsed'>> = {},
): PasswordResetToken {
  const token = new PasswordResetToken();
  token.userId = 'user-id';
  token.tokenHash = hashToken('plain-token');
  token.isUsed = values.isUsed ?? false;
  token.expiresAt = values.expiresAt ?? new Date(Date.now() + 60_000);
  return token;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
