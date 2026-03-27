import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto, LogoutResponseDto } from './dto/auth.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with email, password, and name. Returns JWT tokens on success.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'Registration credentials',
    examples: {
      valid: {
        summary: 'Valid Registration',
        value: {
          email: 'user@example.com',
          password: 'SecurePass123!',
          name: 'John Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input or email already exists',
    type: ErrorResponseDto,
    examples: {
      invalidEmail: {
        summary: 'Invalid Email',
        value: {
          statusCode: 400,
          error: 'Bad Request',
          message: ['email must be an email'],
          timestamp: '2026-03-27T12:00:00.000Z',
        },
      },
      weakPassword: {
        summary: 'Password Too Short',
        value: {
          statusCode: 400,
          error: 'Bad Request',
          message: ['password must be shorter than or equal to 6 characters'],
          timestamp: '2026-03-27T12:00:00.000Z',
        },
      },
      duplicateEmail: {
        summary: 'Email Already Exists',
        value: {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Email already exists',
          timestamp: '2026-03-27T12:00:00.000Z',
        },
      },
    },
  })
  async register(@Body() body: RegisterDto) {
    const tokens = await this.authService.register(body.email, body.password, body.name);
    return tokens;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates user with email and password. Returns JWT tokens and sets refresh token in cookie.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Login credentials',
    examples: {
      valid: {
        summary: 'Valid Login',
        value: {
          email: 'user@example.com',
          password: 'SecurePass123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    type: ErrorResponseDto,
    examples: {
      invalidCredentials: {
        summary: 'Invalid Credentials',
        value: {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid credentials',
          timestamp: '2026-03-27T12:00:00.000Z',
        },
      },
    },
  })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(
      await this.authService.validateUser(body.email, body.password),
    );

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token. Refresh token can be sent in body or cookie.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token (optional if sent via cookie)',
    required: false,
  })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired refresh token',
    type: ErrorResponseDto,
    examples: {
      invalidToken: {
        summary: 'Invalid Refresh Token',
        value: {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid refresh token',
          timestamp: '2026-03-27T12:00:00.000Z',
        },
      },
      noToken: {
        summary: 'No Refresh Token',
        value: {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No refresh token provided',
          timestamp: '2026-03-27T12:00:00.000Z',
        },
      },
    },
  })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = body.refreshToken || res.req.cookies?.refreshToken;

    if (!refreshToken) {
      res.clearCookie('refreshToken');
      return { error: 'No refresh token provided' };
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidates the refresh token and clears the cookie. Requires valid access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired access token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }
}
