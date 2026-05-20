import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';

export interface CreateUserParams {
  email: string;
  passwordHash: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.passwordHash')
      .getOne();
  }

  async createDefaultUser(params: CreateUserParams): Promise<User> {
    const user = this.userRepository.create({
      email: params.email,
      passwordHash: params.passwordHash,
      role: UserRole.USER, // Asignar el rol USER por defecto
    });

    return this.userRepository.save(user);
  }
}
