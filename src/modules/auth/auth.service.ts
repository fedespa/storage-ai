import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/modules/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/tokens-response.dto';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';

// Chequear libreria passport, creo que no la estoy usando.

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly dataSource: DataSource,
  ) {}

  async authenticate(dto: LoginDto): Promise<TokenResponseDto> {
    const { email, password } = dto;
    const user = await this.userService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.generateJwtToken(user.id, user.email);
    const { token, tokenHash } = this.generateRefreshToken();

    await this.refreshTokensService.create(user.id, tokenHash);

    return {
      accessToken,
      refreshToken: token,
    };
  }

  async register(dto: RegisterDto): Promise<TokenResponseDto> {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userService.createDefaultUser({
      email: dto.email,
      passwordHash: hashedPassword,
    });

    const accessToken = await this.generateJwtToken(user.id, user.email);
    const { token, tokenHash } = this.generateRefreshToken();

    await this.refreshTokensService.create(user.id, tokenHash);

    return {
      accessToken,
      refreshToken: token,
    };
  }

  async refresh(oldToken: string): Promise<TokenResponseDto> {
    const oldTokenHash = this.hashToken(oldToken);

    const { token, userId, email } = await this.dataSource.transaction(
      async (manager) => {
        const storedToken = await this.refreshTokensService.findByTokenHash(
          oldTokenHash,
          manager,
        );

        if (!storedToken) {
          throw new UnauthorizedException('Token de refresco inválido');
        }

        if (storedToken.isRevoked || storedToken.isExpired()) {
          throw new UnauthorizedException('Token de refresco inválido');
        }

        const { token, tokenHash } = this.generateRefreshToken();

        await this.refreshTokensService.revoke(storedToken.tokenHash, manager);
        await this.refreshTokensService.create(
          storedToken.userId,
          tokenHash,
          manager,
        );

        return {
          token,
          userId: storedToken.userId,
          email: storedToken.user.email,
        };
      },
    );

    const accessToken = await this.generateJwtToken(userId, email);

    return { accessToken, refreshToken: token };
  }

  private generateRefreshToken(): {
    token: string;
    tokenHash: string;
  } {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    return { token: token, tokenHash: tokenHash };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateJwtToken(
    userId: string,
    email: string,
  ): Promise<string> {
    return await this.jwtService.signAsync({ sub: userId, email });
  }
}
