import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { UsageController } from '../usage.controller';
import {
  UsageMetricsService,
  type UserUsageMetrics,
} from '../usage-metrics.service';

describe('UsageController', () => {
  let application: INestApplication<App>;
  const getForUser = jest.fn<Promise<UserUsageMetrics>, [string]>();

  beforeEach(async () => {
    getForUser.mockImplementation((userId) =>
      Promise.resolve({
        tokenUsage: {
          promptTokens: userId === 'user-a' ? 12 : 99,
          completionTokens: userId === 'user-a' ? 8 : 1,
          totalTokens: userId === 'user-a' ? 20 : 100,
        },
        storageUsage: {
          megabytes: userId === 'user-a' ? 2.5 : 4.75,
        },
      }),
    );

    const module = await Test.createTestingModule({
      controllers: [UsageController],
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn((token: string) =>
              Promise.resolve({
                sub: token === 'token-for-user-a' ? 'user-a' : 'user-b',
                email: 'user@example.com',
              }),
            ),
          },
        },
        {
          provide: UsageMetricsService,
          useValue: { getForUser },
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

  it('rejects unauthenticated requests', async () => {
    await request(application.getHttpServer()).get('/usage').expect(401);

    expect(getForUser).not.toHaveBeenCalled();
  });

  it('rejects requests that attempt to provide a user identifier', async () => {
    await request(application.getHttpServer())
      .get('/usage?userId=user-b')
      .set('Authorization', 'Bearer token-for-user-a')
      .expect(400);

    await request(application.getHttpServer())
      .get('/usage')
      .set('Authorization', 'Bearer token-for-user-a')
      .send({ userId: 'user-b' })
      .expect(400);

    expect(getForUser).not.toHaveBeenCalled();
  });

  it('returns usage exclusively for the user identified by the JWT', async () => {
    await request(application.getHttpServer())
      .get('/usage')
      .set('Authorization', 'Bearer token-for-user-a')
      .expect(200)
      .expect({
        tokenUsage: {
          promptTokens: 12,
          completionTokens: 8,
          totalTokens: 20,
        },
        storageUsage: {
          megabytes: 2.5,
        },
      });

    expect(getForUser).toHaveBeenCalledTimes(1);
    expect(getForUser).toHaveBeenCalledWith('user-a');
  });
});
