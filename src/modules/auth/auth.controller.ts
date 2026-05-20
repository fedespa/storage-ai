/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth/refresh',
};

const COOKIE_NAME = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.authenticate(body);

    response.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);

    return { accessToken };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = request.cookies[COOKIE_NAME];

    if (!oldRefreshToken) {
      throw new UnauthorizedException('No se proporcionó token de refresco');
    }

    const { accessToken, refreshToken } =
      await this.authService.refresh(oldRefreshToken);

    response.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);

    return { accessToken };
  }
}

// @UseGuards(AuthGuard) // Uncomment this line to protect the route with the AuthGuard
