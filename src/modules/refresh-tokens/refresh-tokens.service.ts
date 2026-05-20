import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/database/entities/refresh-token.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokenRepository: Repository<RefreshToken>,
  ) {}

  async create(
    userId: string,
    token: string,
    manager?: EntityManager,
    expiresAt?: Date,
  ): Promise<RefreshToken> {
    const repo = manager
      ? manager.getRepository(RefreshToken)
      : this.tokenRepository;

    const refreshToken = repo.create({
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
      userId,
      tokenHash: token,
    });

    return await repo.save(refreshToken);
  }

  async revoke(tokenHash: string, manager?: EntityManager): Promise<void> {
    const repo = manager
      ? manager.getRepository(RefreshToken)
      : this.tokenRepository;

    await repo.update({ tokenHash }, { isRevoked: true });
  }

  async findByTokenHash(
    tokenHash: string,
    manager?: EntityManager,
  ): Promise<RefreshToken | null> {
    const repo = manager
      ? manager.getRepository(RefreshToken)
      : this.tokenRepository;

    const queryBuilder = repo
      .createQueryBuilder('refreshToken')
      .innerJoinAndSelect('refreshToken.user', 'user')
      .where('refreshToken.tokenHash = :tokenHash', { tokenHash });

    if (manager) {
      queryBuilder.setLock('pessimistic_write');
    }

    return await queryBuilder.getOne();
  }
}
